<?php

namespace PS0132E282\Core\Traits;

use Illuminate\Support\Str;

trait HasValidation
{
    /**
     * Get validation rules from plugins.php config or model configs
     * Merges 'all' rules with action-specific rules (create/update)
     */
    protected function getValidationRules(string $action, $id = null): array
    {
        if (! $this->hasModel()) {
            return [];
        }

        $modelName = class_basename($this->model);
        $plugins = config('plugins', []);

        $validationRules = $this->getValidationRulesFromPlugins($plugins, $modelName, $action, $id);

        if (empty($validationRules)) {
            $validationRules = $this->generateValidationRulesFromModel($action, $id);
        }

        return $validationRules;
    }

    /**
     * Get validation rules from plugins config
     */
    protected function getValidationRulesFromPlugins(array $plugins, string $modelName, string $action, $id): array
    {
        foreach ($plugins as $plugin) {
            if (empty($plugin['enabled']) || ! is_array($plugin['validation'] ?? null)) {
                continue;
            }

            $modelValidation = $this->findModelValidation($plugin['validation'], $modelName);
            if ($modelValidation === null) {
                continue;
            }

            $actionRules = $modelValidation[$action] ?? [];
            $allRules = $this->processAllRules($modelValidation['all'] ?? [], $actionRules);

            $validationRules = array_merge($allRules, $actionRules);

            if ($id !== null) {
                $validationRules = $this->processDynamicRules($validationRules, $id);
            }

            return $validationRules;
        }

        return [];
    }

    /**
     * Find model validation config from plugin validation
     */
    protected function findModelValidation(array $validation, string $modelName): ?array
    {
        if (isset($validation[$modelName])) {
            return $validation[$modelName];
        }

        $pluralKey = strtolower(Str::plural($modelName));
        if (isset($validation[$pluralKey])) {
            return $validation[$pluralKey];
        }

        $singularKey = strtolower($modelName);
        if (isset($validation[$singularKey])) {
            return $validation[$singularKey];
        }

        return null;
    }

    /**
     * Process 'all' rules from validation config
     */
    protected function processAllRules(array $allFields, array $actionRules): array
    {
        if (empty($allFields)) {
            return [];
        }

        $isRules = ! empty($allFields) && array_keys($allFields) !== range(0, count($allFields) - 1);

        if ($isRules) {
            return $allFields;
        }

        if (empty($actionRules)) {
            return [];
        }

        $filteredRules = [];
        foreach ($allFields as $field) {
            if (str_ends_with($field, '.*')) {
                $baseField = str_replace('.*', '', $field);
                foreach ($actionRules as $key => $rule) {
                    if ($key === $field || str_starts_with($key, $baseField.'.')) {
                        $filteredRules[$key] = $rule;
                    }
                }
            } elseif (isset($actionRules[$field])) {
                $filteredRules[$field] = $actionRules[$field];
            }
        }

        return $filteredRules;
    }

    /**
     * Generate validation rules from model $configs property
     */
    protected function generateValidationRulesFromModel(string $action, $id = null): array
    {
        if (! $this->hasModel()) {
            return [];
        }

        $modelInstance = $this->resolveModelInstance();
        $modelConfigs = $this->extractModelConfigs($modelInstance);

        if (empty($modelConfigs)) {
            return [];
        }

        $validationRules = [];

        foreach ($modelConfigs as $fieldName => $fieldConfig) {
            $config = $fieldConfig['config'] ?? [];
            $rules = [];

            if (isset($config['required']) && $config['required'] === true) {
                $rules[] = 'required';
            } else {
                $rules[] = 'nullable';
            }

            if (isset($config['minLength'])) {
                $rules[] = 'min:'.$config['minLength'];
            }
            if (isset($config['maxLength'])) {
                $rules[] = 'max:'.$config['maxLength'];
            }

            if (isset($config['pattern'])) {
                $rules[] = 'regex:'.$config['pattern'];
            }

            if (! empty($rules)) {
                $validationRules[$fieldName] = implode('|', $rules);
            }
        }

        if ($id !== null) {
            $validationRules = $this->processDynamicRules($validationRules, $id);
        }

        return $validationRules;
    }

    /**
     * Process validation rules to replace dynamic placeholders
     */
    protected function processDynamicRules(array $rules, $id): array
    {
        foreach ($rules as $field => $rule) {
            if (is_string($rule)) {
                $rules[$field] = str_replace('$id', $id, $rule);
            }
        }

        return $rules;
    }

    /**
     * Check if validation string contains required rule
     */
    protected function isRequiredFromValidation(string $validationString): bool
    {
        if (empty($validationString)) {
            return false;
        }

        $rules = explode('|', $validationString);

        foreach ($rules as $rule) {
            $rule = trim(strtolower($rule));
            if ($rule === 'required' || str_starts_with($rule, 'required:')) {
                return true;
            }
        }

        return false;
    }

    /**
     * Parse validation string to extract required and set in config
     */
    protected function parseValidationToRequired(array &$config): void
    {
        if (isset($config['validation']) && is_string($config['validation'])) {
            $config['required'] = $this->isRequiredFromValidation($config['validation']);
        }
    }
}
