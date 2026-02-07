<?php

namespace PS0132E282\Core\Traits;

use Illuminate\Http\Request;

trait CanExport
{
    use ProvidesImportExportSchema;

    /**
     * Export resources to CSV/Excel
     *
     * @return \Symfony\Component\HttpFoundation\StreamedResponse
     */
    public function export(Request $request)
    {
        $fileName = 'export_'.date('Y-m-d_H-i-s').'.csv';
        $items = $this->loadItems(); // Re-use index logic for filtering

        $headers = [
            'Content-type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=$fileName",
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        $columns = $this->getExportColumns();

        $callback = function () use ($items, $columns) {
            $file = fopen('php://output', 'w');
            fputcsv($file, array_values($columns)); // Header row

            foreach ($items as $item) {
                $row = [];
                foreach (array_keys($columns) as $key) {
                    $value = data_get($item, $key);
                    if (is_array($value) || is_object($value)) {
                        $value = json_encode($value);
                    }
                    $row[] = $value;
                }
                fputcsv($file, $row);
            }
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
