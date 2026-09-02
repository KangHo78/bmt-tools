<?php

namespace App\Http\Controllers;

use App\Models\AssetCase;
use App\Models\SystemNotification;
use App\Models\ToolUnit;
use App\Models\User;
use App\Support\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class AssetCaseController extends Controller
{
    public function index(Request $request)
    {
        $search = trim((string) $request->q);
        $cases = AssetCase::query()
            ->with([
                'unit.toolType:id,name,code',
                'responsibleUser:id,name,institution',
                'loan.borrower:id,name,institution',
                'loan.items.physicalToken:id,code',
            ])
            ->when($search, fn ($query, $term) => $query->where(function ($query) use ($term) {
                $query->where('case_no', 'like', "%{$term}%")
                    ->orWhere('chronology', 'like', "%{$term}%")
                    ->orWhereHas('responsibleUser', fn ($userQuery) => $userQuery->where('name', 'like', "%{$term}%"))
                    ->orWhereHas('loan.borrower', fn ($borrowerQuery) => $borrowerQuery
                        ->where('name', 'like', "%{$term}%")
                        ->orWhere('institution', 'like', "%{$term}%"))
                    ->orWhereHas('loan', fn ($loanQuery) => $loanQuery->where('trx_no', 'like', "%{$term}%"))
                    ->orWhereHas('unit', fn ($unitQuery) => $unitQuery->where('asset_code', 'like', "%{$term}%"))
                    ->orWhereHas('unit.toolType', fn ($toolQuery) => $toolQuery
                        ->where('name', 'like', "%{$term}%")
                        ->orWhere('code', 'like', "%{$term}%"))
                    ->orWhereHas('loan.items.physicalToken', fn ($tokenQuery) => $tokenQuery->where('code', 'like', "%{$term}%"));
            }))
            ->latest()
            ->paginate(18)
            ->withQueryString();

        return Inertia::render('Cases/Index', [
            'cases' => $cases,
            'filters' => ['q' => $search],
        ]);
    }

    public function show(AssetCase $case)
    {
        $case->load(['unit.toolType', 'loan', 'responsibleUser:id,name,institution', 'replacementUnit.toolType']);

        return Inertia::render('Cases/Show', ['caseData' => $case, 'replacementUnits' => ToolUnit::with('toolType:id,name,code')->where('status', 'tersedia')->get()]);
    }

    public function update(Request $request, AssetCase $case)
    {
        $data = $request->validate(['stage' => ['required', Rule::in(['dilaporkan', 'investigasi', 'berita_acara', 'keputusan', 'selesai'])], 'decision' => ['nullable', 'string', 'max:2000'], 'resolution_status' => ['required', Rule::in(['belum_diproses', 'dalam_proses', 'diperbaiki', 'sudah_diganti', 'dibeli_baru', 'tidak_mengganti', 'dibebaskan'])], 'replacement_unit_id' => ['nullable', 'exists:tool_units,id'], 'report' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'], 'evidence' => ['nullable', 'array'], 'evidence.*' => ['image', 'max:5120']]);
        $urls = $case->evidence_urls ?? [];
        foreach ($request->file('evidence', []) as $file) {
            $urls[] = $file->store('case-evidence', 'public');
        }
        $hasReport = $case->has_berita_acara || $request->hasFile('report');
        if ($request->hasFile('report')) {
            $data['report_url'] = $request->file('report')->store('case-reports', 'public');
        }
        $data['has_berita_acara'] = $hasReport;
        unset($data['report'], $data['evidence']);
        $data['evidence_urls'] = $urls;
        $data['has_evidence'] = $case->has_evidence || count($urls) > 0;
        $data['has_decision'] = ! empty($data['decision']);
        if ($case->stage === 'selesai' && $data['stage'] !== 'selesai') {
            return back()->withErrors(['stage' => 'Kasus yang sudah selesai tidak dapat dibuka kembali.']);
        }
        if ($data['stage'] === 'selesai') {
            if (! $hasReport || ! $data['has_decision']) {
                return back()->withErrors(['stage' => 'Kasus belum dapat ditutup: Berita Acara dan keputusan wajib lengkap.']);
            }
            if (in_array($data['resolution_status'], ['belum_diproses', 'dalam_proses'], true)) {
                return back()->withErrors(['resolution_status' => 'Pilih hasil penyelesaian final sebelum menutup kasus.']);
            }
            if (in_array($data['resolution_status'], ['sudah_diganti', 'dibeli_baru'], true) && empty($data['replacement_unit_id'])) {
                return back()->withErrors(['replacement_unit_id' => 'Unit pengganti wajib dipilih untuk keputusan penggantian atau pembelian baru.']);
            }
            if (! empty($data['replacement_unit_id'])) {
                $replacement = ToolUnit::query()->whereKey($data['replacement_unit_id'])->where('status', 'tersedia')->first();
                if (! $replacement || ($case->unit && $replacement->tool_type_id !== $case->unit->tool_type_id)) {
                    throw ValidationException::withMessages(['replacement_unit_id' => 'Unit pengganti harus tersedia dan memiliki jenis item yang sama.']);
                }
            }
            $data['closed_at'] = now();
        }
        DB::transaction(function () use ($case, $data) {
            $shouldFinalizeReturn = $case->stage !== 'selesai' && $data['stage'] === 'selesai';
            $case->update($data);

            if ($shouldFinalizeReturn && $case->loan_id && $case->unit_id) {
                $item = $case->loan->items()
                    ->where('unit_id', $case->unit_id)
                    ->where('return_status', 'menunggu_kasus')
                    ->with('physicalToken')
                    ->lockForUpdate()
                    ->first();

                if ($item) {
                    $item->update(['return_status' => $case->type]);
                    $item->physicalToken?->update(['status' => 'dipegang_peminjam']);
                    if ($data['resolution_status'] === 'diperbaiki') {
                        $case->unit?->update(['status' => 'tersedia', 'condition' => 'baik']);
                    }
                    if ($case->loan->user_id && ($user = User::query()->lockForUpdate()->find($case->loan->user_id))) {
                        $user->update(['token_used' => max(0, $user->token_used - 1)]);
                        SystemNotification::create([
                            'user_id' => $user->id,
                            'category' => 'informasi',
                            'title' => "Kasus {$case->case_no} selesai",
                            'description' => 'Keputusan kasus telah ditetapkan dan token item telah dilepas.',
                            'object_type' => 'loan',
                            'object_id' => $case->loan_id,
                            'href' => "/peminjaman/{$case->loan_id}",
                        ]);
                    }

                    $hasOutstandingItems = $case->loan->items()
                        ->whereIn('return_status', ['belum_dicek', 'menunggu_kasus'])
                        ->exists();
                    $case->loan->update($hasOutstandingItems
                        ? ['status' => 'menunggu_inspeksi']
                        : ['status' => 'selesai', 'returned_at' => now()]);
                }
            }
        });
        AuditLogger::record('case.updated', $case, ['stage' => $data['stage'], 'resolution' => $data['resolution_status']]);

        return back()->with('success', 'Kasus dan dokumen pertanggungjawaban diperbarui.');
    }
}
