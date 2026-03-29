<?php

namespace PS0132E282\Core\Traits;

use Illuminate\Support\Facades\Auth;

/**
 * Trait for managing view configurations.
 */
trait HasViewConfigs
{
    /**
     * Get views config for a given action.
     */
    protected function getViewsConfig(string $action): array
    {
        $viewKey = in_array($action, ['show', 'create', 'edit']) ? 'form' : $action;
        $viewConfig = $this->getViewConfig($viewKey);
        $baseView = $this->getBaseView($viewKey);

        $views = $baseView;

        if (isset($baseView['fields'])) {
            $processedFields = $viewKey === 'index'
                ? $this->processIndexFields($baseView['fields'])
                : $baseView['fields'];

            $modelConfigs = $this->getModelConfigs();

            $views['fields'] = array_map(function ($field) use ($modelConfigs) {
                $isString = is_string($field);
                $fieldName = $isString ? $field : ($field['name'] ?? null);

                if ($fieldName && isset($modelConfigs[$fieldName])) {
                    $modelCfg = $modelConfigs[$fieldName];
                    $mergeCfg = [];

                    if (isset($modelCfg['ui'])) {
                        $mergeCfg['ui'] = $modelCfg['ui'];
                        $mergeCfg['type'] = $modelCfg['ui']; // fallback type to ui
                    }
                    if (isset($modelCfg['type'])) {
                        $mergeCfg['type'] = $modelCfg['type'];
                    }

                    if ($isString) {
                        return array_merge(['name' => $fieldName], $mergeCfg);
                    }

                    return array_merge($mergeCfg, $field);
                }

                return $field;
            }, $processedFields);
        }

        if (isset($baseView['filters']) || isset($viewConfig['filters'])) {
            $views['filters'] = $viewConfig['filters'] ?? $baseView['filters'];
        }

        if (isset($baseView['sections'])) {
            $merged = $this->mergeFormFieldsWithModelConfigs(['sections' => $baseView['sections']]);
            $views['sections'] = $merged['sections'] ?? [];
        }

        // Resolve dashboard stat queries
        if (isset($views['dashboards']) && is_array($views['dashboards'])) {
            $views['dashboards'] = $this->resolveDashboardStats($views['dashboards']);
        }

        $actions = $viewConfig['actions'] ?? $baseView['actions'] ?? null;

        if (is_array($actions) || $actions === null) {
            $actions = $actions ?? [];
            if (Auth::check()) {
                $user = Auth::user();
                $routeName = request()->route()?->getName() ?? '';
                $resourceGroup = explode('.', str_replace('admin.', '', $routeName))[0] ?? '';

                if ($resourceGroup) {
                    $actionMapping = [
                        'create' => 'create',
                        'edit' => 'edit',
                        'delete' => 'destroy',
                        'import' => 'import',
                        'export' => 'export',
                        'duplicate' => 'duplicate',
                        'trash' => 'trash',
                        'restore' => 'restore',
                        'force-delete' => 'force-delete'
                    ];

                    foreach ($actionMapping as $actionKey => $routeSuffix) {
                        if (!isset($actions[$actionKey]) || $actions[$actionKey] !== false) {
                            $permissionName = "{$resourceGroup}.{$routeSuffix}";
                            if (! $user->can($permissionName)) {
                                $actions[$actionKey] = false;
                            }
                        }
                    }
                    $views['actions'] = $actions;
                } elseif (isset($viewConfig['actions']) || isset($baseView['actions'])) {
                    $views['actions'] = $actions;
                }
            } elseif (isset($viewConfig['actions']) || isset($baseView['actions'])) {
                $views['actions'] = $actions;
            }
        } elseif (isset($viewConfig['actions']) || isset($baseView['actions'])) {
            $views['actions'] = $actions;
        }

        return $views;
    }

    /**
     * Validate request if rules are defined for the given action.
     */
    protected function validateRequest(\Illuminate\Http\Request $request, string $action, $id = null): void
    {
        $rules = $this->getValidationRules($action, $id);

        if (! empty($rules)) {
            // For update, add `sometimes` so only present fields are validated (supports partial updates)
            if ($action === 'update') {
                $rules = array_map(function ($rule) {
                    $ruleStr = is_array($rule) ? implode('|', $rule) : (string) $rule;
                    return str_starts_with($ruleStr, 'sometimes') ? $rule : 'sometimes|' . $ruleStr;
                }, $rules);
            }
            $request->validate($rules);
        }
    }

    /**
     * Sync relationships only when present in extracted data.
     */
    protected function syncRelationshipsIfPresent(\Illuminate\Database\Eloquent\Model $item, array $relations): void
    {
        if (! empty($relations['relationships'])) {
            $this->syncRelationships($item, $relations['relationships']);
        }
    }
}
