<?php

namespace App\Services;

use App\Models\SsoItem;
use App\Models\SsoPurchaseOrder;
use App\Models\ToolType;
use App\Models\ToolUnit;
use App\Support\AuditLogger;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use PhpOffice\PhpSpreadsheet\Cell\DataType;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class MasterAssetExcelService
{
    private const REQUIRED_HEADERS = ['item_no', 'qty', 'no_tool', 'po_no'];

    public function template(): Spreadsheet
    {
        $spreadsheet = new Spreadsheet;
        $sheet = $spreadsheet->getActiveSheet()->setTitle('Import Tools');
        $sheet->fromArray([['ITEM NO', 'QTY', 'NO. TOOL', 'PO NO']], null, 'A1');
        $sheet->getStyle('A1:D1')->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '17211B']],
            'alignment' => ['vertical' => Alignment::VERTICAL_CENTER],
        ]);
        $sheet->getRowDimension(1)->setRowHeight(28);
        foreach (['A' => 18, 'B' => 12, 'C' => 24, 'D' => 30] as $column => $width) {
            $sheet->getColumnDimension($column)->setWidth($width);
        }
        $sheet->freezePane('A2')->setAutoFilter('A1:C1');
        $sheet->getStyle('A2:A1001')->getNumberFormat()->setFormatCode('@');
        $sheet->getStyle('C2:C1001')->getNumberFormat()->setFormatCode('@');

        $items = SsoItem::tools()->orderBy('item_no')->get(['item_no', 'item_name']);
        if ($items->isNotEmpty()) {
            $example = (string) $items->first()->item_no;
            $sheet->fromArray([[$example, 2, $example.'.1', 'CONTOH/PO/01/2026'], [null, null, $example.'.2']], null, 'A2');
            $sheet->setCellValueExplicit('A2', $example, DataType::TYPE_STRING);
            $sheet->setCellValueExplicit('C2', $example.'.1', DataType::TYPE_STRING);
            $sheet->setCellValueExplicit('C3', $example.'.2', DataType::TYPE_STRING);
        }

        $reference = $spreadsheet->createSheet()->setTitle('Referensi Item');
        $reference->fromArray([['ITEM NO', 'NAMA ITEM']], null, 'A1');
        foreach ($items as $index => $item) {
            $row = $index + 2;
            $reference->setCellValueExplicit('A'.$row, (string) $item->item_no, DataType::TYPE_STRING);
            $reference->setCellValue('B'.$row, $item->item_name);
        }
        $reference->getStyle('A1:B1')->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'A96E16']],
        ]);
        $reference->getColumnDimension('A')->setWidth(18);
        $reference->getColumnDimension('B')->setWidth(48);
        $reference->freezePane('A2')->setAutoFilter('A1:B'.max(2, $items->count() + 1));

        $instructions = $spreadsheet->createSheet()->setTitle('Petunjuk');
        $instructions->fromArray([
            ['PETUNJUK IMPORT TOOLS'],
            ['1. Kolom wajib hanya ITEM NO, QTY, NO. TOOL, dan PO NO. Kolom lain akan diabaikan.'],
            ['2. ITEM NO harus tersedia pada Master Item Buana Multi dan bertipe Tool aktif.'],
            ['3. Isi satu NO. TOOL per baris. Baris kode berikutnya boleh mengosongkan ITEM NO dan QTY.'],
            ['4. Jumlah NO. TOOL untuk setiap ITEM NO wajib sama persis dengan QTY.'],
            ['5. NO. TOOL harus unik, belum ada di aplikasi, dan diawali ITEM NO diikuti titik.'],
            ['6. PO NO harus ditemukan di Buana Multi, memuat ITEM NO terkait, dan memiliki user peminta.'],
            ['7. Nama alat diambil dari Master Item; owner unit diambil dari user peminta PO.'],
            ['8. Seluruh import dibatalkan apabila ada satu data yang tidak valid. Maksimal 1.000 baris.'],
        ], null, 'A1');
        $instructions->getStyle('A1')->getFont()->setBold(true)->setSize(16)->getColor()->setRGB('17211B');
        $instructions->getColumnDimension('A')->setWidth(115);
        $instructions->getStyle('A1:A9')->getAlignment()->setWrapText(true)->setVertical(Alignment::VERTICAL_TOP);
        $spreadsheet->setActiveSheetIndex(0);

        return $spreadsheet;
    }

    /** @return array{created:int, updated:int, units:int, rows:int} */
    public function import(UploadedFile $file): array
    {
        try {
            $spreadsheet = IOFactory::load($file->getRealPath());
        } catch (\Throwable) {
            throw ValidationException::withMessages(['import_file' => 'File Excel tidak dapat dibaca. Gunakan file .xlsx atau .xls yang valid.']);
        }

        $sheet = $spreadsheet->getSheet(0);
        $rows = $sheet->toArray(null, true, true, false);
        $spreadsheet->disconnectWorksheets();
        if ($rows === []) {
            throw ValidationException::withMessages(['import_file' => 'File Excel tidak berisi data.']);
        }

        $headers = array_map(fn ($value) => $this->normaliseHeader((string) $value), $rows[0]);
        $columns = [];
        foreach (self::REQUIRED_HEADERS as $header) {
            $index = array_search($header, $headers, true);
            if ($index === false) {
                throw ValidationException::withMessages(['import_file' => 'Kolom wajib harus memuat ITEM NO, QTY, NO. TOOL, dan PO NO.']);
            }
            $columns[$header] = $index;
        }

        $dataRows = array_filter(
            array_slice($rows, 1, null, true),
            fn ($row) => collect($columns)->contains(fn ($column) => $this->cellText($row[$column] ?? null) !== '')
        );
        if ($dataRows === []) {
            throw ValidationException::withMessages(['import_file' => 'Belum ada data tools untuk diimpor.']);
        }
        if (count($dataRows) > 1000) {
            throw ValidationException::withMessages(['import_file' => 'Maksimal 1.000 baris dalam satu kali import.']);
        }

        $errors = [];
        $groups = [];
        $currentKey = null;
        foreach ($dataRows as $offset => $row) {
            $excelRow = $offset + 1;
            $itemNo = $this->cellText($row[$columns['item_no']] ?? null);
            $quantity = $this->cellText($row[$columns['qty']] ?? null);
            $toolCode = $this->toolCodeText($row[$columns['no_tool']] ?? null);
            $poNumber = $this->cellText($row[$columns['po_no']] ?? null);

            if ($itemNo !== '') {
                $itemKey = $this->normaliseName($itemNo);
                $groupKey = $itemKey.'|'.$this->normaliseName($poNumber);
                if (isset($groups[$groupKey])) {
                    $errors[] = "Baris {$excelRow}: kombinasi ITEM NO {$itemNo} dan PO NO {$poNumber} sudah didefinisikan pada baris {$groups[$groupKey]['row']}.";
                    $currentKey = null;
                } else {
                    $groups[$groupKey] = ['row' => $excelRow, 'item_no' => $itemNo, 'item_key' => $itemKey, 'po_no' => $poNumber, 'quantity_raw' => $quantity, 'quantity' => null, 'codes' => []];
                    $currentKey = $groupKey;
                }
            } elseif ($quantity !== '') {
                $errors[] = "Baris {$excelRow}: QTY tidak boleh diisi tanpa ITEM NO.";
            }

            if ($toolCode !== '') {
                if ($currentKey === null) {
                    $errors[] = "Baris {$excelRow}: NO. TOOL {$toolCode} tidak memiliki ITEM NO.";
                } else {
                    $groups[$currentKey]['codes'][] = ['value' => $toolCode, 'row' => $excelRow];
                }
            }
        }

        $itemNumbers = collect($groups)->pluck('item_no')->unique()->values();
        $sources = SsoItem::tools()->whereIn('item_no', $itemNumbers)->get()
            ->keyBy(fn ($item) => $this->normaliseName((string) $item->item_no));
        $poNumbers = collect($groups)->pluck('po_no')->filter()->unique()->values();
        $documentRecords = SsoPurchaseOrder::query()
            ->where('flag', 1)
            ->where(fn ($query) => $query
                ->whereIn('po_no', $poNumbers)
                ->orWhereIn('new_po_no', $poNumbers))
            ->with(['requester:id,name,username,is_active,is_group', 'items' => fn ($query) => $query->where('flag', 1)->where('active', 1)->select(['id', 'purchase_order_id', 'item_id'])])
            ->get();
        $documents = $poNumbers->mapWithKeys(fn ($poNumber) => [
            $this->normaliseName((string) $poNumber) => $documentRecords->filter(fn ($document) => collect([$document->po_no, $document->new_po_no])
                ->filter()
                ->contains(fn ($reference) => $this->normaliseName((string) $reference) === $this->normaliseName((string) $poNumber)))
                ->values(),
        ]);
        $seenCodes = [];
        foreach ($groups as &$group) {
            $itemKey = $group['item_key'];
            $quantity = filter_var($group['quantity_raw'], FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
            if ($quantity === false) {
                $errors[] = "Baris {$group['row']}: QTY untuk ITEM NO {$group['item_no']} wajib berupa bilangan bulat minimal 1.";
            } else {
                $group['quantity'] = $quantity;
                if (count($group['codes']) !== $quantity) {
                    $errors[] = "Baris {$group['row']}: ITEM NO {$group['item_no']} memiliki QTY {$quantity}, tetapi NO. TOOL yang terisi ".count($group['codes']).'.';
                }
            }
            if (! isset($sources[$itemKey])) {
                $errors[] = "Baris {$group['row']}: ITEM NO {$group['item_no']} tidak ditemukan pada Master Item Tool aktif.";
            }
            if ($group['po_no'] === '') {
                $errors[] = "Baris {$group['row']}: PO NO wajib diisi.";
            } else {
                $documentMatches = $documents[$this->normaliseName($group['po_no'])] ?? collect();
                if ($documentMatches->count() !== 1) {
                    $errors[] = $documentMatches->isEmpty()
                        ? "Baris {$group['row']}: PO NO {$group['po_no']} tidak ditemukan pada Buana Multi."
                        : "Baris {$group['row']}: PO NO {$group['po_no']} tidak unik pada Buana Multi.";
                } else {
                    $document = $documentMatches->first();
                    $requesterName = trim((string) ($document->requester?->name ?: $document->requester?->username));
                    if (! $document->requester || ! $document->requester->is_active || $document->requester->is_group || $requesterName === '') {
                        $errors[] = "Baris {$group['row']}: PO NO {$group['po_no']} tidak memiliki user peminta aktif yang valid.";
                    }
                    if (isset($sources[$itemKey])) {
                        $sourceItem = $document->items->firstWhere('item_id', $sources[$itemKey]->id);
                        if (! $sourceItem) {
                            $errors[] = "Baris {$group['row']}: ITEM NO {$group['item_no']} tidak tercantum pada PO NO {$group['po_no']}.";
                        } else {
                            $group['source_po_item_id'] = $sourceItem->id;
                        }
                    }
                    $group['document_key'] = $this->normaliseName($group['po_no']);
                }
            }
            foreach ($group['codes'] as $codeRow) {
                $code = $codeRow['value'];
                $codeKey = $this->normaliseName($code);
                if (mb_strlen($code) > 255) {
                    $errors[] = "Baris {$codeRow['row']}: NO. TOOL maksimal 255 karakter.";
                }
                if (! str_starts_with($codeKey, $itemKey.'.')) {
                    $errors[] = "Baris {$codeRow['row']}: NO. TOOL {$code} harus diawali {$group['item_no']}.";
                }
                if (isset($seenCodes[$codeKey])) {
                    $errors[] = "Baris {$codeRow['row']}: NO. TOOL {$code} duplikat dengan baris {$seenCodes[$codeKey]}.";
                } else {
                    $seenCodes[$codeKey] = $codeRow['row'];
                }
            }
        }
        unset($group);

        $allCodes = collect($groups)->flatMap(fn ($group) => collect($group['codes'])->pluck('value'))->values();
        foreach (ToolUnit::query()->whereIn('asset_code', $allCodes)->pluck('asset_code') as $code) {
            $errors[] = "NO. TOOL {$code} sudah terdaftar di aplikasi.";
        }

        $errors = array_values(array_unique($errors));
        if ($errors !== []) {
            $visible = array_slice($errors, 0, 12);
            if (count($errors) > 12) {
                $visible[] = 'Dan '.(count($errors) - 12).' kesalahan lainnya.';
            }
            throw ValidationException::withMessages(['import_file' => implode("\n", $visible)]);
        }

        return DB::transaction(function () use ($groups, $sources, $documents) {
            $created = 0;
            $updated = 0;
            $unitCount = 0;
            foreach ($groups as $group) {
                $source = $sources[$group['item_key']];
                $document = $documents[$group['document_key']]->first();
                $owner = trim((string) ($document->requester->name ?: $document->requester->username));
                $data = [
                    'sso_item_id' => $source->id,
                    'code' => $source->item_no,
                    'name' => $source->item_name,
                    'manufacture_pn' => $source->manufacture_pn,
                    'original_manufacture' => $source->original_manufacture,
                    'article_no' => $source->article_no,
                    'unit' => $source->unit,
                    'size' => $source->article_no,
                    'description' => $source->specification,
                    'image_url' => $source->image,
                ];
                $toolType = ToolType::query()->where('sso_item_id', $source->id)
                    ->orWhere('code', $source->item_no)->lockForUpdate()->first();
                $before = $toolType?->only(array_keys($data));
                if ($toolType) {
                    $toolType->update($data);
                    $updated++;
                } else {
                    $toolType = ToolType::create([...$data, 'checklist' => []]);
                    $created++;
                }
                foreach ($group['codes'] as $codeRow) {
                    ToolUnit::create([
                        'tool_type_id' => $toolType->id,
                        'asset_code' => $codeRow['value'],
                        'status' => 'tersedia',
                        'condition' => 'baik',
                        'location_id' => $toolType->primary_location_id,
                        'owner' => $owner,
                        'owner_sso_user_id' => $document->requester->id,
                        'source_po_id' => $document->id,
                        'source_po_item_id' => $group['source_po_item_id'],
                        'source_reference' => $group['po_no'],
                    ]);
                    $unitCount++;
                }
                AuditLogger::record(
                    $before ? 'tool_type.import_updated' : 'tool_type.import_created',
                    $toolType,
                    ['before' => $before, 'after' => $data, 'unit_count' => count($group['codes'])],
                );
            }

            return ['created' => $created, 'updated' => $updated, 'units' => $unitCount, 'rows' => count($groups)];
        });
    }

    public function writer(Spreadsheet $spreadsheet): Xlsx
    {
        return new Xlsx($spreadsheet);
    }

    private function normaliseHeader(string $value): string
    {
        $slug = preg_replace('/[^a-z0-9]+/', '_', mb_strtolower($value));

        return trim(preg_replace('/_+/', '_', $slug), '_');
    }

    private function cellText(mixed $value): string
    {
        if (is_float($value)) {
            return rtrim(rtrim(number_format($value, 10, '.', ''), '0'), '.');
        }

        return trim((string) $value);
    }

    private function toolCodeText(mixed $value): string
    {
        $text = $this->cellText($value);
        if (is_numeric($text) && str_contains($text, '.')) {
            return rtrim(rtrim(number_format((float) $text, 10, '.', ''), '0'), '.');
        }

        return $text;
    }

    private function normaliseName(string $value): string
    {
        return mb_strtolower(trim(preg_replace('/\s+/', ' ', $value)));
    }
}
