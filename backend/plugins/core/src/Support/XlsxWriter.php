<?php

namespace PS0132E282\Core\Support;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Facades\Excel;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

/**
 * XLSX writer backed by maatwebsite/excel v3.
 */
class XlsxWriter
{
    private array $headers = [];

    private array $rows = [];

    public function setHeaders(array $headers): self
    {
        $this->headers = array_values($headers);

        return $this;
    }

    public function addRow(array $row): self
    {
        $this->rows[] = array_values($row);

        return $this;
    }

    /**
     * Generate XLSX and return a temp file path.
     */
    public function generate(): string
    {
        $tmpFile = tempnam(sys_get_temp_dir(), 'xlsx_').'.xlsx';
        $content = Excel::raw($this->buildExport(), \Maatwebsite\Excel\Excel::XLSX);
        file_put_contents($tmpFile, $content);

        return $tmpFile;
    }

    /**
     * Return an HTTP download response directly.
     */
    public function download(string $fileName)
    {
        return Excel::download($this->buildExport(), $fileName.'.xlsx');
    }

    private function buildExport(): object
    {
        $headers = $this->headers;
        $rows = $this->rows;

        return new class($headers, $rows) implements FromArray, WithHeadings, ShouldAutoSize, WithStyles
        {
            public function __construct(
                private readonly array $headings,
                private readonly array $data,
            ) {}

            public function headings(): array
            {
                return $this->headings;
            }

            public function array(): array
            {
                return $this->data;
            }

            public function styles(Worksheet $sheet): array
            {
                return [
                    1 => [
                        'font' => ['bold' => true],
                        'fill' => [
                            'fillType' => Fill::FILL_SOLID,
                            'startColor' => ['argb' => 'FFD9E1F2'],
                        ],
                    ],
                ];
            }
        };
    }
}
