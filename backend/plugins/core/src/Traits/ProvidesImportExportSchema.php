<?php

namespace PS0132E282\Core\Traits;

use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

trait ProvidesImportExportSchema
{
    /**
     * Get columns for export, optionally filtered by requested field keys.
     * Reads `const views['index']['actions']['export']['fields']` first,
     * then falls back to all DB columns.
     *
     * @param  array<string>|null  $requestedFields  Column keys to include (null = all)
     * @return array<string, string>  [key => label]
     */
    protected function getExportColumns(?array $requestedFields = null): array
    {
        $viewsConfig = defined(static::class.'::views') ? static::views : [];
        $configuredFields = $viewsConfig['index']['actions']['export']['fields']
            ?? $viewsConfig['index']['actions']['import']['fields']
            ?? null;

        if ($configuredFields) {
            $map = [];
            foreach ($configuredFields as $field) {
                $col = is_array($field) ? ($field['name'] ?? '') : (string) $field;
                if (! $col || str_contains($col, '.')) {
                    continue;
                }
                $label = is_array($field) ? ($field['label'] ?? null) : null;
                $map[$col] = $label ?? Str::title(str_replace('_', ' ', $col));
            }

            return $this->filterColumns($map, $requestedFields);
        }

        // Fallback: derive from DB schema
        $model = new $this->model;
        $table = $model->getTable();
        $columns = Schema::getColumnListing($table);
        $exclude = ['password', 'remember_token', 'deleted_at'];

        $map = [];
        foreach ($columns as $col) {
            if (in_array($col, $exclude)) {
                continue;
            }
            $map[$col] = Str::title(str_replace('_', ' ', $col));
        }

        return $this->filterColumns($map, $requestedFields);
    }

    /**
     * Get allowed column keys for import from views config.
     *
     * @return array<string>
     */
    protected function getImportColumns(): array
    {
        $viewsConfig = defined(static::class.'::views') ? static::views : [];
        $importFields = $viewsConfig['index']['actions']['import']['fields'] ?? null;

        if (! $importFields) {
            return array_keys($this->getExportColumns());
        }

        $cols = [];
        foreach ($importFields as $field) {
            $col = is_array($field) ? ($field['name'] ?? '') : (string) $field;
            if ($col && ! str_contains($col, '.')) {
                $cols[] = $col;
            }
        }

        return $cols;
    }

    private function filterColumns(array $map, ?array $requestedFields): array
    {
        if (! $requestedFields) {
            return $map;
        }

        return array_intersect_key($map, array_flip($requestedFields));
    }
}
