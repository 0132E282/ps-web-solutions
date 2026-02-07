<?php

namespace PS0132E282\Core\Traits;

use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

trait ProvidesImportExportSchema
{
    protected function getExportColumns(): array
    {
        // Default to all database columns
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

        return $map;
    }
}
