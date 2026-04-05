<?php

namespace PS0132E282\Core\Traits;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

trait FieldTrait
{
    protected array $selectedFields = [];

    // ─── Fields ──────────────────────────────────────────────────────────────

    protected function applyFields(Builder $query, array|string|null $fields = []): Builder
    {
        $fields = is_string($fields) ? array_map('trim', explode(',', $fields)) : ($fields ?? []);
        if (empty($fields)) return $query;

        $this->selectedFields = ['columns' => [], 'relations' => []];
        $table = $query->getModel()->getTable();

        foreach ($fields as $field) {
            $this->processField($query, $field, $this->selectedFields);
        }

        $this->ensureEssentialColumns($query, $table);
        $this->loadSelectedRelations($query, $table);

        return $query->select(array_unique($this->selectedFields['columns']));
    }

    protected function processField(Builder $query, string $field, array &$selected): void
    {
        $table = $query->getModel()->getTable();

        if (Str::contains($field, '.')) {
            [$relation, $nested] = explode('.', $field, 2);
            if (method_exists($query->getModel(), $relation)) {
                $selected['relations'][$relation] ??= ['columns' => [], 'relations' => []];
                $rel = $query->getModel()->{$relation}();
                if ($rel instanceof Relation) {
                    $this->processField($rel->getModel()->newQuery(), $nested, $selected['relations'][$relation]);
                }
            }
            return;
        }

        if (Str::contains($field, '->')) {
            if (Str::endsWith($field, '->toRaw')) {
                $selected['columns'][] = "{$table}." . Str::beforeLast($field, '->toRaw');
            } else {
                $selected['columns'][] = "{$field} as {$field}";
                $selected['columns'][] = "{$table}." . Str::before($field, '->');
            }
            return;
        }

        if (method_exists($query->getModel(), $field) && ! Str::is($field, $table)) {
            $selected['relations'][$field] ??= ['columns' => [], 'relations' => []];
        } else {
            $selected['columns'][] = "{$table}.{$field}";
        }
    }

    protected function ensureEssentialColumns(Builder $query, string $table): void
    {
        if (empty($this->selectedFields['columns'])) {
            $this->selectedFields['columns'] = ["{$table}.*"];
            return;
        }

        $cols = $this->selectedFields['columns'];
        if (! in_array("{$table}.id", $cols) && ! in_array("{$table}.*", $cols)) {
            $this->selectedFields['columns'][] = "{$table}.id";
        }
    }

    protected function loadSelectedRelations(Builder $query, string $table): void
    {
        foreach ($this->selectedFields['relations'] as $relation => $nestedFields) {
            if (! method_exists($query->getModel(), $relation)) continue;

            $rel = $query->getModel()->{$relation}();

            if ($rel instanceof BelongsTo) {
                $fk = $rel->getForeignKeyName();
                $cols = $this->selectedFields['columns'];
                if (! in_array("{$table}.{$fk}", $cols) && ! in_array("{$table}.*", $cols)) {
                    $this->selectedFields['columns'][] = "{$table}.{$fk}";
                }
            }

            $rel instanceof MorphTo
                ? $query->with($relation)
                : $query->with([$relation => fn($q) => $this->applyNestedFields($q, $nestedFields)]);
        }
    }

    protected function applyNestedFields($query, array $nestedFields): void
    {
        $table = $query->getModel()->getTable();
        $key   = $query->getModel()->getKeyName();
        $cols  = $nestedFields['columns'];

        if (! empty($cols) && ! in_array("{$table}.{$key}", $cols) && ! in_array("{$table}.*", $cols)) {
            $cols[] = "{$table}.{$key}";
        }

        foreach ($nestedFields['relations'] as $relation => $subFields) {
            if (! method_exists($query->getModel(), $relation)) continue;

            $rel = $query->getModel()->{$relation}();
            if ($rel instanceof BelongsTo) {
                $fk = $rel->getForeignKeyName();
                if (! empty($cols) && ! in_array("{$table}.{$fk}", $cols) && ! in_array("{$table}.*", $cols)) {
                    $cols[] = "{$table}.{$fk}";
                }
            }

            $query->with([$relation => fn($q) => $this->applyNestedFields($q, $subFields)]);
        }

        if (! empty($cols)) $query->select(array_unique($cols));
    }

    protected function getFieldsFromRequest(?Request $request = null): ?string
    {
        $request = $request ?? request();
        $fields  = $request->input('fields');
        if ($fields === null) return null;
        return \is_array($fields) ? implode(',', $fields) : (string) $fields;
    }

    protected function applyFieldsFromRequest(Builder $query, ?Request $request = null): Builder
    {
        return $this->applyFields($query, $this->getFieldsFromRequest($request));
    }

    protected function parseFields(?string $fieldsString = null, ?string $modelClass = null): array
    {
        if (empty($fieldsString)) return ['columns' => ['*'], 'relationships' => []];

        $columns = $relationships = [];
        foreach (array_map('trim', explode(',', $fieldsString)) as $field) {
            if (str_contains($field, '.')) {
                $rel = explode('.', $field)[0];
                if (! in_array($rel, $relationships)) $relationships[] = $rel;
            } else {
                $columns[] = $field;
            }
        }

        return ['columns' => $columns ?: ['*'], 'relationships' => $relationships];
    }

    protected function getColumns(?string $fieldsString = null, ?string $modelClass = null): array
    {
        return $this->parseFields($fieldsString, $modelClass)['columns'];
    }

    protected function getRelationships(?string $fieldsString = null, ?string $modelClass = null): array
    {
        return $this->parseFields($fieldsString, $modelClass)['relationships'];
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    protected function getNestedFieldValue($model, string $field, $default = null)
    {
        if (Str::endsWith($field, '->toRaw')) {
            $base = Str::beforeLast($field, '->toRaw');
            return is_object($model) && method_exists($model, 'getRawOriginal')
                ? ($model->getRawOriginal($base) ?? data_get($model, $base, $default))
                : data_get($model, $base, $default);
        }
        return data_get($model, $field, $default);
    }
}
