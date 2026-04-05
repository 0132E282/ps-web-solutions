<?php

namespace PS0132E282\Core\Traits;

use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Maatwebsite\Excel\Facades\Excel;
use PS0132E282\Core\Support\XlsxWriter;

trait CanImport
{
    use ProvidesImportSchema;

    /**
     * Import resources from CSV or XLSX/XLS.
     * Returns JSON: { message, imported, errors[] }
     */
    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt,xlsx,xls|max:10240',
        ]);

        $file = $request->file('file');
        $importColumns = $this->getImportColumns();
        $errors = [];
        $imported = 0;

        try {
            $import = new class implements \Maatwebsite\Excel\Concerns\ToArray
            {
                public array $data = [];

                public function array(array $array): void
                {
                    $this->data = $array;
                }
            };

            Excel::import($import, $file);

            $rows = array_values(array_filter(
                array_map(function (array $row) {
                    $normalized = array_map(fn ($v) => $v !== null ? (string) $v : '', $row);
                    while (!empty($normalized) && end($normalized) === '') {
                        array_pop($normalized);
                    }

                    return $normalized;
                }, $import->data),
                fn ($r) => !empty($r),
            ));

            if (empty($rows)) {
                return response()->json(['message' => 'File không có dữ liệu.'], 422);
            }

            $rawHeaders = array_shift($rows);
            $headerMap = $this->buildHeaderMap($rawHeaders, $importColumns);

            foreach ($rows as $rowIndex => $row) {
                $data = [];
                foreach ($row as $colIdx => $value) {
                    if (isset($headerMap[$colIdx])) {
                        $data[$headerMap[$colIdx]] = $value !== '' ? $value : null;
                    }
                }

                if (empty(array_filter($data, fn ($v) => $v !== null))) {
                    continue; // skip blank rows
                }

                unset($data['id'], $data['created_at'], $data['updated_at']);
                $data = $this->prepareImportData($data);

                try {
                    $this->model::create($data);
                    $imported++;
                } catch (\Throwable $e) {
                    $errors[] = 'Dòng '.($rowIndex + 2).': '.$e->getMessage();
                    if (\count($errors) >= 20) {
                        $errors[] = '... (quá nhiều lỗi, dừng báo cáo)';
                        break;
                    }
                }
            }

            $message = "Import thành công {$imported} bản ghi.";
            if ($errors) {
                $message .= ' '.\count($errors).' dòng bị lỗi.';
            }

            return response()->json([
                'message' => $message,
                'imported' => $imported,
                'errors' => $errors,
            ]);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Lỗi import: '.$e->getMessage()], 500);
        }
    }

    /**
     * Download an import template file (xlsx or csv).
     * Query params: format (xlsx|csv)
     */
    public function importTemplate(Request $request)
    {
        $format = $request->get('format', 'xlsx');
        $importColumns = $this->getImportColumns();
        $exportColumns = $this->getExportColumns();

        $headers = [];
        foreach ($importColumns as $col) {
            $headers[] = $exportColumns[$col] ?? Str::title(str_replace('_', ' ', $col));
        }

        $fileName = 'template_import_'.Str::snake(class_basename($this->model));

        if ($format === 'xlsx') {
            $writer = new XlsxWriter;
            $writer->setHeaders($headers);

            return $writer->download($fileName);
        }

        return response()->stream(function () use ($headers) {
            $f = fopen('php://output', 'w');
            fprintf($f, "\xEF\xBB\xBF");
            fputcsv($f, $headers);
            fclose($f);
        }, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename={$fileName}.csv",
        ]);
    }

    /**
     * Map CSV/XLSX header labels → DB column keys.
     * Strategies: exact key match → label match → snake_case fallback.
     */
    private function buildHeaderMap(array $rawHeaders, array $allowedColumns): array
    {
        $exportColumns = $this->getExportColumns(); // [key => label]
        $labelToKey = array_flip($exportColumns);   // [label => key]

        $map = [];
        foreach ($rawHeaders as $idx => $header) {
            $header = trim($header);

            if (\in_array($header, $allowedColumns, true)) {
                $map[$idx] = $header;
            } elseif (isset($labelToKey[$header]) && \in_array($labelToKey[$header], $allowedColumns, true)) {
                $map[$idx] = $labelToKey[$header];
            } else {
                $snaked = Str::snake($header);
                if (\in_array($snaked, $allowedColumns, true)) {
                    $map[$idx] = $snaked;
                }
            }
        }

        return $map;
    }

    /**
     * Hook for subclasses to transform import data before creation.
     */
    protected function prepareImportData(array $data): array
    {
        return $data;
    }
}
