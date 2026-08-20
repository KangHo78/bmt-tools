<?php

namespace App\Http\Controllers;

use App\Models\AssetCase;
use App\Models\ToolUnit;
use App\Support\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class AssetCaseController extends Controller
{
    public function index()
    {
        return Inertia::render('Cases/Index', ['cases' => AssetCase::with(['unit.toolType', 'responsibleUser:id,name,institution'])->latest()->get()]);
    }

    public function show(AssetCase $case)
    {
        $case->load(['unit.toolType', 'loan', 'responsibleUser:id,name,institution', 'replacementUnit.toolType']);

        return Inertia::render('Cases/Show', ['caseData' => $case, 'replacementUnits' => ToolUnit::with('toolType:id,name,code')->where('status', 'tersedia')->get()]);
    }

    public function update(Request $request, AssetCase $case)
    {
        $data = $request->validate(['stage' => ['required', Rule::in(['dilaporkan', 'investigasi', 'berita_acara', 'keputusan', 'selesai'])], 'decision' => ['nullable', 'string', 'max:2000'], 'resolution_status' => ['required', Rule::in(['belum_diproses', 'dalam_proses', 'diperbaiki', 'sudah_diganti', 'tidak_mengganti', 'dibebaskan'])], 'replacement_unit_id' => ['nullable', 'exists:tool_units,id'], 'report' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'], 'evidence' => ['nullable', 'array'], 'evidence.*' => ['image', 'max:5120']]);
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
        if ($data['stage'] === 'selesai') {
            if (! $hasReport || ! $data['has_decision']) {
                return back()->withErrors(['stage' => 'Kasus belum dapat ditutup: Berita Acara dan keputusan wajib lengkap.']);
            }
            $data['closed_at'] = now();
        }
        $case->update($data);
        AuditLogger::record('case.updated', $case, ['stage' => $data['stage'], 'resolution' => $data['resolution_status']]);

        return back()->with('success', 'Kasus dan dokumen pertanggungjawaban diperbarui.');
    }
}
