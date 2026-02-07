<?php

namespace PS0132E282\Core\Traits;

use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

trait HasFieldDetection
{
    /**
     * Process index fields to auto-detect type from model casts
     * Auto-adds type config for datetime/date fields
     */
    protected function processIndexFields(array $fields): array
    {
        if (! $this->hasModel() || empty($fields)) {
            return $fields;
        }

        $modelInstance = $this->resolveModelInstance();
        $casts = $modelInstance->getCasts();
        $tableName = $modelInstance->getTable();

        return array_map(function ($field) use ($casts, $tableName) {
            if (is_array($field)) {
                return $field;
            }

            $fieldConfig = $this->detectFieldType($field, $casts, $tableName);

            return $fieldConfig ?? $field;
        }, $fields);
    }

    /**
     * Detect field type from model casts or database column type
     */
    protected function detectFieldType(string $fieldName, array $casts, string $tableName): ?array
    {
        // Priority 1: Check model casts
        if (isset($casts[$fieldName])) {
            $castType = ! empty($casts[$fieldName]) ? class_basename($casts[$fieldName]) : null;

            $fieldConfig = match (true) {
                $castType === 'FileMedia' => [
                    'name' => $fieldName,
                    'type' => 'string',
                    'ui' => Str::plural($fieldName) === $fieldName ? 'attachments' : 'attachment',
                ],
                $castType === 'Localization' => ['name' => $fieldName, 'type' => 'string', 'ui' => 'text'],
                $castType === 'boolean' || $castType === 'bool' => ['name' => $fieldName, 'type' => 'boolean', 'ui' => 'switch'],
                in_array($castType, ['integer', 'int']) => $this->detectIntegerFieldType($fieldName),
                in_array($castType, ['real', 'float', 'double', 'decimal']) => ['name' => $fieldName, 'type' => 'number', 'ui' => 'number'],
                in_array($castType, ['datetime', 'date', 'timestamp']) => ['name' => $fieldName, 'type' => 'date', 'ui' => 'date'],
                in_array($castType, ['array', 'json', 'object', 'collection']) => ['name' => $fieldName, 'type' => 'json', 'ui' => 'code'],
                $castType === 'string' => ['name' => $fieldName, 'type' => 'string', 'ui' => 'text'],
                default => null,
            };

            if ($fieldConfig !== null) {
                $fieldConfig['size'] = $this->getDefaultFieldWidth($fieldConfig['ui'] ?? $fieldConfig['type'], $fieldName);

                return $fieldConfig;
            }
        }

        // Priority 2: Check database column type
        if (Schema::hasColumn($tableName, $fieldName)) {
            $columnType = Schema::getColumnType($tableName, $fieldName);

            $fieldConfig = match ($columnType) {
                'boolean', 'bool' => ['name' => $fieldName, 'type' => 'boolean', 'ui' => 'switch'],
                'datetime', 'date', 'timestamp' => ['name' => $fieldName, 'type' => 'date', 'ui' => 'date'],
                'enum' => ['name' => $fieldName, 'type' => 'string', 'ui' => 'badge'],
                'integer', 'bigint', 'smallint', 'tinyint' => $columnType === 'tinyint' && $fieldName === 'is_active'
                    ? ['name' => $fieldName, 'type' => 'boolean', 'ui' => 'switch']
                    : $this->detectIntegerFieldType($fieldName),
                'decimal', 'float', 'double' => ['name' => $fieldName, 'type' => 'number', 'ui' => 'number'],
                'json' => ['name' => $fieldName, 'type' => 'json', 'ui' => 'code'],
                'text', 'mediumtext', 'longtext' => ['name' => $fieldName, 'type' => 'string', 'ui' => 'textarea', 'size' => 300],
                'string', 'varchar', 'char' => ['name' => $fieldName, 'type' => 'string', 'ui' => 'text'],
                default => null,
            };

            if ($fieldConfig !== null) {
                if (! isset($fieldConfig['size'])) {
                    $fieldConfig['size'] = $this->getDefaultFieldWidth($fieldConfig['type'], $fieldName);
                }

                return $fieldConfig;
            }
        }

        return null;
    }

    /**
     * Detect field type for integer columns based on field name
     */
    protected function detectIntegerFieldType(string $fieldName): array
    {
        if ($fieldName === 'id') {
            return ['name' => $fieldName, 'type' => 'integer', 'ui' => 'number', 'size' => 120];
        }

        if (str_ends_with($fieldName, '_id')) {
            return ['name' => $fieldName, 'type' => 'integer', 'ui' => 'number', 'size' => 80];
        }

        if (str_contains($fieldName, 'count') || str_contains($fieldName, 'quantity') || str_contains($fieldName, 'total')) {
            return ['name' => $fieldName, 'type' => 'integer', 'ui' => 'number', 'size' => 100];
        }

        return ['name' => $fieldName, 'type' => 'integer', 'ui' => 'number'];
    }

    /**
     * Get default field width based on field type and name
     */
    protected function getDefaultFieldWidth(string $type, string $fieldName): int
    {
        return match ($type) {
            'date' => 150,
            'attachment' => 80,
            'attachments' => 120,
            'badge' => 120,
            'number' => str_ends_with($fieldName, '_id') ? 80 : 100,
            'text' => 200,
            default => 150,
        };
    }
}
