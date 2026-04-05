<?php

namespace PS0132E282\Core\Traits;

use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Facades\Excel;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

trait CanExport
{
    use ProvidesExportSchema;

    /**
     * Export resources to XLSX or CSV.
     * Query params:
     *   - format: 'xlsx' | 'csv'  (default: xlsx)
     *   - columns: comma-separated column keys
     *   - filter: 'all' | 'current_filters' | 'today'
     *   - search: global search string (when filter=current_filters)
     *   - filters[field]: column filter values (when filter=current_filters)
     */
    public function export(Request $request)
    {
        $format = $request->get('format', 'xlsx');
        $requestedFields = $request->get('columns')
            ? array_filter(explode(',', $request->get('columns')))
            : null;

        $columns = $this->getExportColumns($requestedFields ?: null);
        $columnKeys = array_keys($columns);
        $headers = array_values($columns);

        $query = $this->buildExportQuery($request, $columnKeys);
        $fileName = Str::snake(class_basename($this->model)).'_export_'.date('Y-m-d_H-i-s');

        $export = new class($query, $columnKeys, $headers) implements FromQuery, WithHeadings, WithMapping, ShouldAutoSize, WithStyles
        {
            public function __construct(
                private readonly mixed $baseQuery,
                private readonly array $columnKeys,
                private readonly array $headings,
            ) {}

            public function query()
            {
                return $this->baseQuery;
            }

            public function headings(): array
            {
                return $this->headings;
            }

            public function map($item): array
            {
                $row = [];
                foreach ($this->columnKeys as $key) {
                    $value = data_get($item, $key);
                    if (\is_array($value) || \is_object($value)) {
                        $value = json_encode($value);
                    }
                    $row[] = $value !== null ? (string) $value : '';
                }

                return $row;
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

        if ($format === 'csv') {
            return Excel::download($export, $fileName.'.csv', \Maatwebsite\Excel\Excel::CSV, [
                'Content-Type' => 'text/csv; charset=UTF-8',
            ]);
        }

        return Excel::download($export, $fileName.'.xlsx');
    }

    private function buildExportQuery(Request $request, array $columnKeys)
    {
        $query = $this->model::query();
        $filterType = $request->get('filter', 'current_filters');

        if ($filterType === 'today') {
            $query->whereDate('created_at', today());
        } elseif ($filterType === 'current_filters') {
            if ($search = $request->get('search')) {
                $model = new $this->model;
                $searchable = method_exists($model, 'getSearchableFields')
                    ? $model->getSearchableFields()
                    : array_filter(['name', 'title', 'email'], fn ($f) => \in_array($f, $columnKeys));

                $query->where(function ($q) use ($search, $searchable) {
                    foreach ($searchable as $field) {
                        $q->orWhere($field, 'like', "%{$search}%");
                    }
                });
            }

            foreach ($request->query() as $key => $value) {
                if (str_starts_with($key, 'filters[') && $value !== '') {
                    $field = substr($key, 8, -1);
                    if ($field && \in_array($field, $columnKeys)) {
                        $query->where($field, $value);
                    }
                }
            }
        }
        // 'all' = no additional filtering

        return $query;
    }
}
