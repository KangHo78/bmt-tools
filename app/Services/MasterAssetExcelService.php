<?php

namespace App\Services;

use App\Models\Category;
use App\Models\ChecklistItem;
use App\Models\Location;
use App\Models\SsoItem;
use App\Models\ToolType;
use App\Support\AuditLogger;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use PhpOffice\PhpSpreadsheet\Cell\DataType;
use PhpOffice\PhpSpreadsheet\Cell\DataValidation;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class MasterAssetExcelService
{
    private const HEADERS = ['item_no', 'kategori', 'lokasi_utama', 'aturan_peminjaman', 'checklist'];

    public function template(): Spreadsheet
    {
        $spreadsheet = new Spreadsheet;
        $sheet = $spreadsheet->getActiveSheet()->setTitle('Import Master Aset');
        $sheet->fromArray([['ITEM NO', 'KATEGORI', 'LOKASI UTAMA', 'ATURAN PEMINJAMAN', 'CHECKLIST']], null, 'A1');

        $sheet->getStyle('A1:E1')->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '17211B']],
            'alignment' => ['vertical' => Alignment::VERTICAL_CENTER],
        ]);
        $sheet->getRowDimension(1)->setRowHeight(28);
        foreach (['A' => 18, 'B' => 26, 'C' => 28, 'D' => 44, 'E' => 42] as $column => $width) {
            $sheet->getColumnDimension($column)->setWidth($width);
        }
        $sheet->freezePane('A2')->setAutoFilter('A1:E1');
        $sheet->getStyle('A2:A1001')->getNumberFormat()->setFormatCode('@');
        $sheet->getStyle('D2:E1001')->getAlignment()->setWrapText(true)->setVertical(Alignment::VERTICAL_TOP);

        $reference = $spreadsheet->createSheet()->setTitle('Referensi');
        $reference->fromArray([['ITEM NO', 'NAMA ITEM', 'KATEGORI', 'LOKASI UTAMA', 'CHECKLIST']], null, 'A1');
        $items = SsoItem::tools()->orderBy('item_no')->get(['item_no', 'item_name']);
        $categories = Category::orderBy('name')->pluck('name')->values();
        $locations = Location::orderBy('name')->pluck('name')->values();
        $checklists = ChecklistItem::orderBy('name')->pluck('name')->values();
        $rowCount = max($items->count(), $categories->count(), $locations->count(), $checklists->count(), 1);
        for ($index = 0; $index < $rowCount; $index++) {
            $rowNumber = $index + 2;
            if (isset($items[$index])) {
                $reference->setCellValueExplicit('A'.$rowNumber, (string) $items[$index]->item_no, DataType::TYPE_STRING);
            }
            $reference->fromArray([[
                $items[$index]->item_name ?? null,
                $categories[$index] ?? null,
                $locations[$index] ?? null,
                $checklists[$index] ?? null,
            ]], null, 'B'.$rowNumber);
        }
        $reference->getStyle('A1:E1')->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'A96E16']],
        ]);
        foreach (['A' => 18, 'B' => 42, 'C' => 28, 'D' => 28, 'E' => 42] as $column => $width) {
            $reference->getColumnDimension($column)->setWidth($width);
        }
        $reference->freezePane('A2')->setAutoFilter('A1:E'.($rowCount + 1));

        $this->addListValidation($sheet, 'A2:A1001', "'Referensi'!\$A\$2:\$A\$".max(2, $items->count() + 1));
        $this->addListValidation($sheet, 'B2:B1001', "'Referensi'!\$C\$2:\$C\$".max(2, $categories->count() + 1));
        $this->addListValidation($sheet, 'C2:C1001', "'Referensi'!\$D\$2:\$D\$".max(2, $locations->count() + 1));

        $instructions = $spreadsheet->createSheet()->setTitle('Petunjuk');
        $instructions->fromArray([
            ['PETUNJUK IMPORT MASTER ASET'],
            ['1. Isi satu master aset per baris pada sheet "Import Master Aset".'],
            ['2. ITEM NO harus tersedia pada Master Item Buana Multi dan bertipe Tool aktif.'],
            ['3. KATEGORI dan LOKASI UTAMA harus sama dengan data pada sheet Referensi.'],
            ['4. Pisahkan beberapa CHECKLIST dengan tanda |. Poin baru akan dibuat otomatis.'],
            ['5. ITEM NO yang sudah menjadi master aset akan diperbarui.'],
            ['6. Jangan mengubah nama kolom pada baris pertama. Maksimal 1.000 baris.'],
        ], null, 'A1');
        $instructions->getStyle('A1')->getFont()->setBold(true)->setSize(16)->getColor()->setRGB('17211B');
        $instructions->getColumnDimension('A')->setWidth(110);
        $instructions->getStyle('A1:A7')->getAlignment()->setWrapText(true)->setVertical(Alignment::VERTICAL_TOP);
        $spreadsheet->setActiveSheetIndex(0);

        return $spreadsheet;
    }

    /** @return array{created:int, updated:int, rows:int} */
    public function import(UploadedFile $file): array
    {
        try {
            $spreadsheet = IOFactory::load($file->getRealPath());
        } catch (\Throwable) {
            throw ValidationException::withMessages(['import_file' => 'File Excel tidak dapat dibaca. Gunakan template .xlsx yang disediakan.']);
        }

        $sheet = $spreadsheet->getSheet(0);
        $rows = $sheet->toArray(null, true, true, false);
        $spreadsheet->disconnectWorksheets();
        if ($rows === []) {
            throw ValidationException::withMessages(['import_file' => 'File Excel tidak berisi data.']);
        }

        $headers = array_map(fn ($value) => $this->normaliseHeader((string) $value), array_slice($rows[0], 0, 5));
        if ($headers !== self::HEADERS) {
            throw ValidationException::withMessages(['import_file' => 'Format kolom tidak sesuai. Unduh dan gunakan template import terbaru.']);
        }

        $dataRows = array_filter(
            array_slice($rows, 1, null, true),
            fn ($row) => collect(array_slice($row, 0, 5))->contains(fn ($value) => trim((string) $value) !== '')
        );
        if ($dataRows === []) {
            throw ValidationException::withMessages(['import_file' => 'Belum ada baris master aset untuk diimpor.']);
        }
        if (count($dataRows) > 1000) {
            throw ValidationException::withMessages(['import_file' => 'Maksimal 1.000 baris dalam satu kali import.']);
        }

        $categories = $this->uniqueNameMap(Category::all(), 'Kategori');
        $locations = $this->uniqueNameMap(Location::all(), 'Lokasi');
        $itemNumbers = collect($dataRows)->pluck(0)->map(fn ($value) => trim((string) $value))->filter()->unique()->values();
        $sources = SsoItem::tools()->whereIn('item_no', $itemNumbers)->get()->keyBy(fn ($item) => $this->normaliseName($item->item_no));
        $errors = [];
        $prepared = [];
        $seen = [];

        foreach ($dataRows as $offset => $row) {
            $excelRow = $offset + 1;
            [$itemNo, $categoryName, $locationName, $rules, $checklistText] = array_map(fn ($value) => trim((string) $value), array_pad(array_slice($row, 0, 5), 5, ''));
            $itemKey = $this->normaliseName($itemNo);
            $categoryKey = $this->normaliseName($categoryName);
            $locationKey = $this->normaliseName($locationName);
            $checklists = collect(explode('|', $checklistText))
                ->map(fn ($name) => trim($name))
                ->filter()
                ->unique(fn ($name) => $this->normaliseName($name))
                ->values()
                ->all();

            $rowErrors = [];
            if ($itemNo === '') {
                $rowErrors[] = 'ITEM NO wajib diisi';
            } elseif (isset($seen[$itemKey])) {
                $rowErrors[] = "ITEM NO duplikat dengan baris {$seen[$itemKey]}";
            } elseif (! isset($sources[$itemKey])) {
                $rowErrors[] = 'ITEM NO tidak ditemukan pada Master Item Tool aktif';
            }
            if ($categoryName === '' || ! isset($categories[$categoryKey])) {
                $rowErrors[] = 'KATEGORI tidak ditemukan';
            }
            if ($locationName === '' || ! isset($locations[$locationKey])) {
                $rowErrors[] = 'LOKASI UTAMA tidak ditemukan';
            }
            if ($checklists === []) {
                $rowErrors[] = 'CHECKLIST wajib diisi dan dipisahkan dengan tanda |';
            } elseif (collect($checklists)->contains(fn ($name) => mb_strlen($name) > 255)) {
                $rowErrors[] = 'nama CHECKLIST maksimal 255 karakter';
            }

            if ($rowErrors !== []) {
                $errors[] = "Baris {$excelRow}: ".implode('; ', $rowErrors).'.';

                continue;
            }
            $seen[$itemKey] = $excelRow;
            $prepared[] = [
                'source' => $sources[$itemKey],
                'category' => $categories[$categoryKey],
                'location' => $locations[$locationKey],
                'rules' => $rules,
                'checklists' => $checklists,
            ];
        }

        if ($errors !== []) {
            $visible = array_slice($errors, 0, 12);
            if (count($errors) > 12) {
                $visible[] = 'Dan '.(count($errors) - 12).' kesalahan lainnya.';
            }
            throw ValidationException::withMessages(['import_file' => implode("\n", $visible)]);
        }

        return DB::transaction(function () use ($prepared) {
            $created = 0;
            $updated = 0;
            foreach ($prepared as $row) {
                $source = $row['source'];
                $checklistIds = collect($row['checklists'])->map(fn ($name) => ChecklistItem::firstOrCreate(['name' => $name])->id)->all();
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
                    'category_id' => $row['category']->id,
                    'primary_location_id' => $row['location']->id,
                    'rules_summary' => $row['rules'] ?: null,
                    'checklist' => $row['checklists'],
                ];
                $toolType = ToolType::query()->where('sso_item_id', $source->id)->orWhere('code', $source->item_no)->first();
                $before = $toolType?->only(array_keys($data));
                if ($toolType) {
                    $toolType->update($data);
                    $updated++;
                } else {
                    $toolType = ToolType::create($data);
                    $created++;
                }
                $toolType->checklistItems()->sync(collect($checklistIds)->mapWithKeys(fn ($id, $position) => [$id => ['position' => $position]]));
                AuditLogger::record($before ? 'tool_type.import_updated' : 'tool_type.import_created', $toolType, $before ? ['before' => $before, 'after' => $data] : []);
            }

            return ['created' => $created, 'updated' => $updated, 'rows' => count($prepared)];
        });
    }

    public function writer(Spreadsheet $spreadsheet): Xlsx
    {
        return new Xlsx($spreadsheet);
    }

    private function addListValidation($sheet, string $range, string $formula): void
    {
        $validation = new DataValidation;
        $validation->setType(DataValidation::TYPE_LIST)->setErrorStyle(DataValidation::STYLE_STOP)->setAllowBlank(false)->setShowDropDown(true)->setShowErrorMessage(true)->setErrorTitle('Pilihan tidak valid')->setError('Pilih nilai dari daftar referensi.')->setFormula1($formula);
        $sheet->setDataValidation($range, $validation);
    }

    private function normaliseHeader(string $value): string
    {
        $slug = preg_replace('/[^a-z0-9]+/', '_', mb_strtolower($value));

        return trim(preg_replace('/_+/', '_', $slug), '_');
    }

    private function normaliseName(string $value): string
    {
        return mb_strtolower(trim(preg_replace('/\s+/', ' ', $value)));
    }

    /** @return array<string, mixed> */
    private function uniqueNameMap($models, string $label): array
    {
        $map = [];
        foreach ($models as $model) {
            $key = $this->normaliseName($model->name);
            if (isset($map[$key])) {
                throw ValidationException::withMessages(['import_file' => "{$label} bernama '{$model->name}' tidak unik. Rapikan master data sebelum import."]);
            }
            $map[$key] = $model;
        }

        return $map;
    }
}
