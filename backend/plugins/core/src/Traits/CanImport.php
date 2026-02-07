<?php

namespace PS0132E282\Core\Traits;

use Illuminate\Http\Request;
use Illuminate\Support\Str;

trait CanImport
{
    use ProvidesImportExportSchema;

    /**
     * Import resources from CSV/Excel
     *
     * @return \Illuminate\Http\RedirectResponse
     */
    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt,xlsx,xls',
        ]);

        $file = $request->file('file');
        try {
            // Simple CSV import
            if ($file->getClientOriginalExtension() === 'csv' || $file->getClientOriginalExtension() === 'txt') {
                $this->processCsvImport($file->getRealPath());
            } else {
                return redirect()->back()->with('error', 'Hiện tại chỉ hỗ trợ import file CSV.');
            }

            return redirect()->route($this->getRouteName('index'))
                ->with('success', 'Import dữ liệu thành công.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Lỗi import: '.$e->getMessage());
        }
    }

    /**
     * Download import template
     *
     * @return \Symfony\Component\HttpFoundation\StreamedResponse
     */
    public function importTemplate(Request $request)
    {
        $fileName = 'template_import.csv';
        $columns = $this->getExportColumns(); // Use same columns for template

        $headers = [
            'Content-type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=$fileName",
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        $callback = function () use ($columns) {
            $file = fopen('php://output', 'w');
            fputcsv($file, array_values($columns)); // Header row
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    protected function processCsvImport(string $path)
    {
        $file = fopen($path, 'r');
        $headers = fgetcsv($file);

        // Normalize headers to align with export columns
        $exportMap = $this->getExportColumns();
        $headerMap = [];
        foreach ($headers as $index => $header) {
            $key = array_search($header, $exportMap);
            if ($key !== false) {
                $headerMap[$index] = $key;
            } else {
                // Try strict match if key is used as header
                if (isset($exportMap[$header])) {
                    $headerMap[$index] = $header;
                } else {
                    // Fallback: snake_case the header
                    $headerMap[$index] = Str::snake($header);
                }
            }
        }

        while (($row = fgetcsv($file)) !== false) {
            $data = [];
            foreach ($row as $index => $value) {
                if (isset($headerMap[$index])) {
                    $data[$headerMap[$index]] = $value;
                }
            }

            if (! empty($data)) {
                // Remove ID if present to avoid conflict
                unset($data['id']);
                unset($data['created_at']);
                unset($data['updated_at']);

                $data = $this->prepareImportData($data);
                $this->model::create($data);
            }
        }
        fclose($file);
    }

    protected function prepareImportData(array $data): array
    {
        return $data;
    }
}
