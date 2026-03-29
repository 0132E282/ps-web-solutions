<?php

namespace PS0132E282\Core\Support;

use Maatwebsite\Excel\Facades\Excel;

/**
 * XLSX/XLS/CSV reader backed by maatwebsite/excel v3.
 * Returns all rows including header as a 2D array of strings.
 */
class XlsxReader
{
    /**
     * @param  string  $filePath  Absolute path to the file
     * @return array<int, array<int, string>> All rows including header row
     */
    public function read(string $filePath): array
    {
        $import = new class implements \Maatwebsite\Excel\Concerns\ToArray
        {
            public array $data = [];

            public function array(array $array): void
            {
                $this->data = $array;
            }
        };

        Excel::import($import, $filePath);

        $rows = [];
        foreach ($import->data as $row) {
            $normalized = array_map(fn ($v) => $v !== null ? (string) $v : '', $row);
            while (!empty($normalized) && end($normalized) === '') {
                array_pop($normalized);
            }
            if (!empty($normalized)) {
                $rows[] = $normalized;
            }
        }

        return $rows;
    }
}
