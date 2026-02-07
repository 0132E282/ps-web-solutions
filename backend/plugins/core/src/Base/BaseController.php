<?php

namespace PS0132E282\Core\Base;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use PS0132E282\Core\Traits\AutoTransform;
use PS0132E282\Core\Traits\HasCrudAction;
use PS0132E282\Core\Traits\HasDuplication;
use PS0132E282\Core\Traits\HasFieldDetection;
use PS0132E282\Core\Traits\HasFormConfig;
use PS0132E282\Core\Traits\HasLocalization;
use PS0132E282\Core\Traits\HasModelResolver;
use PS0132E282\Core\Traits\HasValidation;
use PS0132E282\Core\Traits\Relationships;

class BaseController extends Controller
{
    use AutoTransform, HasDuplication, HasFormConfig, HasFieldDetection, HasCrudAction, Relationships {
        Relationships::isRelationship insteadof AutoTransform;
    }
    use HasLocalization, HasModelResolver, HasValidation;

    protected ?string $model = null;

    protected ?string $type = null;

    public function __construct()
    {
        if ($this->model) {
            $this->model = model_class(class: $this->model);
        }
    }

    public function index()
    {
        $items = $this->loadItems();

        if (request()->wantsJson()) {
            return Resource::items($items);
        }

        $views = $this->getViewsConfig('index');
        $configs = $this->getModelConfigs();

        $inertiaData = [
            'views' => $views,
            'configs' => $configs,
        ];

        if ($items instanceof \Illuminate\Contracts\Pagination\LengthAwarePaginator) {
            $inertiaData['items'] = $items->items();
            $inertiaData['pagination'] = Resource::extractPagination($items);
        } else {
            $inertiaData['items'] = $items instanceof \Illuminate\Support\Collection
                ? $items->toArray()
                : (is_array($items) ? $items : []);
        }

        return Inertia::render($this->getPage('index'), $inertiaData);
    }

    public function form($id = null)
    {
        $views = $this->getViewsConfig('form');
        $configs = $this->getModelConfigs();
        $item = null;

        if (! empty($id)) {
            $item = $this->loadItemForForm($id);

            if (request()->wantsJson()) {
                $itemArray = $item->toArray();
                foreach ($itemArray as $key => $value) {
                    if ($this->isLocalizedField($item, $key)) {
                        $itemArray[$key] = $this->decodeLocalizedValue($item->getRawOriginal($key));
                    }
                }

                return Resource::item($itemArray);
            }
        }

        return Inertia::render($this->getPage('form'), [
            'views' => $views,
            'configs' => $configs,
            'item' => $item,
        ]);
    }

    public function edit($id, Request $request)
    {
        // If it's a GET request, just show the form
        if ($request->isMethod('get')) {
            return $this->form($id);
        }

        return $this->saveItem($id, $request, false);
    }

    public function update($id, Request $request)
    {
        return $this->saveItem($id, $request, true);
    }

    public function store(Request $request)
    {
        $rules = $this->getValidationRules('create');
        if (! empty($rules)) {
            $request->validate($rules);
        }

        $data = $this->prepareRequestData($request);
        $relations = $this->extractRelationships($data);

        $item = $this->model::query()->create($data);

        if (! empty($relations['relationships'])) {
            $this->syncRelationships($item, $relations['relationships']);
        }

        if ($request->wantsJson()) {
            return Resource::item($item->fresh(), ['status' => 201]);
        }

        return redirect()->route($this->getRouteName('index'))
            ->with('success', 'Tạo thành công');
    }

    public function destroy($id)
    {
        $item = $this->model::query()->findOrFail($id);

        $deleteRules = $this->getValidationRules('delete', $id);
        if (! empty($deleteRules)) {
            request()->validate($deleteRules);
        }

        $item->delete();

        if (request()->wantsJson()) {
            return response()->json(['message' => 'Xóa thành công']);
        }

        return redirect()->route($this->getRouteName('index'))
            ->with('success', 'Xóa thành công');
    }

    /**
     * Shared logic for edit() and update() - saves an item and returns appropriate response
     */
    protected function saveItem($id, Request $request, bool $redirectToIndex = false)
    {
        $item = $this->model::query()->findOrFail($id);

        $rules = $this->getValidationRules('update', $id);
        if (! empty($rules)) {
            $request->validate($rules);
        }

        $data = $this->prepareRequestData($request);
        $relations = $this->extractRelationships($data);

        $item->update($data);

        if (! empty($relations['relationships'])) {
            $this->syncRelationships($item, $relations['relationships']);
        }

        session()->flash('success', 'Cập nhật thành công');

        if ($request->wantsJson()) {
            return Resource::item($item->fresh());
        }

        if ($redirectToIndex) {
            return redirect()->route($this->getRouteName('index'))
                ->with('success', 'Cập nhật thành công');
        }

        $views = $this->getViewsConfig('form');
        $configs = $this->getModelConfigs();

        return Inertia::render($this->getPage('form'), [
            'views' => $views,
            'configs' => $configs,
            'item' => $item->fresh(),
            'isEdit' => true,
        ]);
    }

    /**
     * Prepare request data by transforming and merging files
     */
    protected function prepareRequestData(Request $request): array
    {
        $data = $this->autoTransformRequest($request->all());
        $files = $request->allFiles();

        $data = $this->mergeNestedFields($data);

        return ! empty($files) ? array_merge($data, $files) : $data;
    }

    /**
     * Merge nested fields into parent objects
     * Example: property.type, property.values -> property: { type, values }
     */
    protected function mergeNestedFields(array $data): array
    {
        $nestedGroups = [];
        $toRemove = [];

        foreach ($data as $key => $value) {
            if (str_contains($key, '.')) {
                [$parentKey, $childKey] = explode('.', $key, 2);

                if (! isset($nestedGroups[$parentKey])) {
                    $nestedGroups[$parentKey] = [];
                }

                $this->setNestedValue($nestedGroups[$parentKey], $childKey, $value);
                $toRemove[] = $key;
            }
        }

        foreach ($toRemove as $key) {
            unset($data[$key]);
        }

        foreach ($nestedGroups as $parentKey => $nestedData) {
            if (isset($data[$parentKey]) && is_array($data[$parentKey])) {
                $data[$parentKey] = array_merge($data[$parentKey], $nestedData);
            } else {
                $data[$parentKey] = $nestedData;
            }
        }

        return $data;
    }

    /**
     * Set nested value in array using dot notation
     */
    protected function setNestedValue(array &$array, string $key, $value): void
    {
        if (! str_contains($key, '.')) {
            $array[$key] = $value;

            return;
        }

        $keys = explode('.', $key);
        $current = &$array;

        foreach ($keys as $i => $k) {
            if ($i === count($keys) - 1) {
                $current[$k] = $value;
            } else {
                if (! isset($current[$k]) || ! is_array($current[$k])) {
                    $current[$k] = [];
                }
                $current = &$current[$k];
            }
        }
    }

    /**
     * Get views config for a given action
     * Extracts UI definitions from controller const views and merges with model configs
     */
    protected function getViewsConfig(string $action): array
    {
        $viewKey = in_array($action, ['show', 'create', 'edit']) ? 'form' : $action;
        $viewConfig = $this->getViewConfig($viewKey);
        $baseView = $this->getBaseView($viewKey);

        $views = array_filter([
            'title' => $baseView['title'] ?? null,
            'description' => $baseView['description'] ?? null,
            'icon' => $baseView['icon'] ?? null,
        ], fn($value) => $value !== null);

        if (isset($baseView['fields'])) {
            $views['fields'] = $viewKey === 'index'
                ? $this->processIndexFields($baseView['fields'])
                : $baseView['fields'];
        }

        if (isset($baseView['filters']) || isset($viewConfig['filters'])) {
            $views['filters'] = $viewConfig['filters'] ?? $baseView['filters'];
        }

        if (isset($baseView['sections'])) {
            $merged = $this->mergeFormFieldsWithModelConfigs(['sections' => $baseView['sections']]);
            $views['sections'] = $merged['sections'] ?? [];
        }

        if (isset($viewConfig['actions']) || isset($baseView['actions'])) {
            $views['actions'] = $viewConfig['actions'] ?? $baseView['actions'];
        }

        return $views;
    }
}
