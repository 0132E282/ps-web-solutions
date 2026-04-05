<?php

namespace PS0132E282\Core\Traits;

trait ProvidesImportSchema
{
    use ProvidesExportSchema;

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
}
