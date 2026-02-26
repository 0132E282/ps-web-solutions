<?php

namespace PS0132E282\Core\Base;

use App\Http\Controllers\Controller;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
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

    // =========================================================================
    // # Public CRUD Actions
    // =========================================================================

    public function index()
    {
        $items = $this->loadItems();
        $itemsArray = $this->transformItemsForView($items, 'index');

        if (request()->wantsJson()) {
            return Resource::items($itemsArray, $this->buildPaginationMeta($items));
        }

        return $this->renderInertia('index', [
            'items' => $itemsArray,
            ...$this->buildPaginationMeta($items),
        ]);
    }

    public function form($id = null)
    {
        $item = $id ? $this->loadItemForForm($id) : null;

        if ($item && request()->wantsJson()) {
            return Resource::item($this->localizeItemArray($item));
        }

        return $this->renderInertia('form', ['item' => $item]);
    }

    public function edit($id, Request $request)
    {
        // * GET request: only render the form view
        if ($request->isMethod('get')) {
            return $this->form($id);
        }

        return $this->saveItem($id, $request, redirectToIndex: false);
    }

    public function update($id, Request $request)
    {
        return $this->saveItem($id, $request, redirectToIndex: true);
    }

    public function store(Request $request)
    {
        $this->validateRequest($request, 'create');

        $data = $this->prepareRequestData($request);
        $relations = $this->extractRelationships($data);

        $item = $this->model::query()->create($data);
        $this->syncRelationshipsIfPresent($item, $relations);

        if ($request->wantsJson()) {
            return Resource::item($item->fresh(), ['status' => 201]);
        }

        return $this->redirectToIndex(__('core::messages.created'));
    }

    public function destroy($id)
    {
        $item = $this->model::query()->findOrFail($id);

        $this->validateRequest(request(), 'delete', $id);

        $item->delete();

        if (request()->wantsJson()) {
            return response()->json(['message' => __('core::messages.deleted')]);
        }

        return $this->redirectToIndex(__('core::messages.deleted'));
    }

    public function bulkDestroy(Request $request)
    {
        $ids = $request->input('ids', []);
        if (empty($ids)) {
            return response()->json(['message' => 'No items selected'], 400);
        }

        $this->model::query()->whereIn('id', $ids)->delete();

        return response()->json(['message' => __('core::messages.deleted')]);
    }

    public function bulkDuplicate(Request $request)
    {
        $ids = $request->input('ids', []);
        foreach ($ids as $id) {
            $this->duplicate($id, $request);
        }

        return response()->json(['message' => __('core::messages.duplicated')]);
    }

    public function bulkRestore(Request $request)
    {
        $ids = $request->input('ids', []);
        $this->model::query()->onlyTrashed()->whereIn('id', $ids)->restore();

        return response()->json(['message' => __('core::messages.restored')]);
    }

    public function bulkForceDelete(Request $request)
    {
        $ids = $request->input('ids', []);
        $this->model::query()->onlyTrashed()->whereIn('id', $ids)->forceDelete();

        return response()->json(['message' => __('core::messages.deleted')]);
    }

    // =========================================================================
    // # Protected Core Actions
    // =========================================================================

    /**
     * * Shared logic for edit() and update() - saves an item and returns appropriate response
     */
    protected function saveItem($id, Request $request, bool $redirectToIndex = false)
    {
        $item = $this->model::query()->findOrFail($id);

        $this->validateRequest($request, 'update', $id);

        $data = $this->prepareRequestData($request);
        $relations = $this->extractRelationships($data);

        $item->update($data);
        $this->syncRelationshipsIfPresent($item, $relations);

        if ($request->wantsJson()) {
            return Resource::item($item->fresh());
        }

        if ($redirectToIndex) {
            return $this->redirectToIndex(__('core::messages.updated'));
        }

        return $this->renderInertia('form', [
            'item'   => $item->fresh(),
            'isEdit' => true,
        ], flash: __('core::messages.updated'));
    }

    /**
     * * Prepare request data by transforming and merging files
     */
    protected function prepareRequestData(Request $request): array
    {
        $data = $this->autoTransformRequest($request->all());
        $data = $this->mergeNestedFields($data);

        $files = $request->allFiles();

        return ! empty($files) ? array_merge($data, $files) : $data;
    }

    /**
     * * Merge nested dot-notation fields into parent arrays
     *   Example: "property.type" + "property.values" → property: { type, values }
     */
    protected function mergeNestedFields(array $data): array
    {
        $nestedGroups = [];
        $dotKeys = [];

        foreach ($data as $key => $value) {
            if (! str_contains($key, '.')) {
                continue;
            }

            [$parentKey, $childKey] = explode('.', $key, 2);

            $nestedGroups[$parentKey] ??= [];
            $this->setNestedValue($nestedGroups[$parentKey], $childKey, $value);
            $dotKeys[] = $key;
        }

        foreach ($dotKeys as $key) {
            unset($data[$key]);
        }

        foreach ($nestedGroups as $parentKey => $nestedData) {
            $data[$parentKey] = isset($data[$parentKey]) && is_array($data[$parentKey])
                ? array_merge($data[$parentKey], $nestedData)
                : $nestedData;
        }

        return $data;
    }

    /**
     * * Transform items based on view configuration (handle dot notation fields)
     */
    protected function transformItemsForView($items, string $action): array
    {
        $dotFields = $this->resolveDotFieldsForAction($action);

        $rawItems = $this->extractItemCollection($items);

        if (empty($dotFields)) {
            return $rawItems->map(fn($item) => $this->itemToArray($item))->values()->toArray();
        }

        return $rawItems->map(fn($item) => $this->applyDotFields($item, $dotFields))->values()->toArray();
    }

    /**
     * * Get views config for a given action
     */
    protected function getViewsConfig(string $action): array
    {
        $viewKey = in_array($action, ['show', 'create', 'edit']) ? 'form' : $action;
        $viewConfig = $this->getViewConfig($viewKey);
        $baseView = $this->getBaseView($viewKey);

        $views = $baseView;

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

        $actions = $viewConfig['actions'] ?? $baseView['actions'] ?? null;

        if (is_array($actions) || $actions === null) {
            $actions = $actions ?? [];
            if (auth()->check()) {
                $user = auth()->user();
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

    // =========================================================================
    // # Private Helpers - Response Builders
    // =========================================================================

    /**
     * * Render an Inertia page with views + configs merged automatically
     */
    private function renderInertia(string $action, array $extra = [], ?string $flash = null): InertiaResponse
    {
        if ($flash) {
            session()->flash('success', $flash);
        }

        return Inertia::render($this->getPage($action), [
            'views'   => $this->getViewsConfig($action),
            'configs' => $this->getModelConfigs(),
            ...$extra,
        ]);
    }

    /**
     * * Redirect to index route with a flash message
     */
    private function redirectToIndex(string $message)
    {
        return redirect()->route($this->getRouteName('index'))->with('success', $message);
    }

    /**
     * * Build pagination meta array (empty if not paginated)
     */
    private function buildPaginationMeta($items): array
    {
        if (! $items instanceof LengthAwarePaginator) {
            return [];
        }

        return ['pagination' => Resource::extractPagination($items)];
    }

    /**
     * * Validate request if rules are defined for the given action
     */
    private function validateRequest(Request $request, string $action, $id = null): void
    {
        $rules = $this->getValidationRules($action, $id);

        if (! empty($rules)) {
            $request->validate($rules);
        }
    }

    /**
     * * Sync relationships only when present in extracted data
     */
    private function syncRelationshipsIfPresent(Model $item, array $relations): void
    {
        if (! empty($relations['relationships'])) {
            $this->syncRelationships($item, $relations['relationships']);
        }
    }

    // =========================================================================
    // # Private Helpers - Item Transformation
    // =========================================================================

    /**
     * * Resolve fields with dot notation for a given action
     */
    private function resolveDotFieldsForAction(string $action): array
    {
        $viewConfig = $this->getViewConfig($action);
        $fields = $this->extractFieldNames($viewConfig['config']['fields'] ?? $viewConfig['fields'] ?? []);

        return array_values(array_filter($fields, fn($f) => str_contains($f, '.')));
    }

    /**
     * * Extract collection of items from paginator, collection, or array
     */
    private function extractItemCollection($items): Collection
    {
        if ($items instanceof LengthAwarePaginator) {
            return collect($items->items());
        }

        return $items instanceof Collection ? $items : collect($items);
    }

    /**
     * * Convert a single item to plain array
     */
    private function itemToArray($item): array
    {
        return $item instanceof Model ? $item->toArray() : (array) $item;
    }

    /**
     * * Apply dot-notation field resolution to a single item
     */
    private function applyDotFields($item, array $dotFields): array
    {
        $data = $this->itemToArray($item);

        foreach ($dotFields as $field) {
            if (isset($data[$field])) {
                continue;
            }

            $data[$field] = $this->resolveFieldValue($item, $field);
        }

        return $data;
    }

    /**
     * * Resolve value for a dot-notation field from a model or array item
     */
    private function resolveFieldValue($item, string $field): mixed
    {
        $value = data_get($item, $field);

        if ($value !== null) {
            return $value;
        }

        $parts    = explode('.', $field);
        $relation = $parts[0];

        // * Check if the relation is a loaded collection (BelongsToMany / HasMany)
        $relationData = $item->{$relation} ?? null;

        if ($relationData instanceof Collection || is_array($relationData)) {
            $property = implode('.', array_slice($parts, 1));

            return collect($relationData)
                ->map(fn($relItem) => [$property => data_get($relItem, $property)])
                ->values()
                ->toArray();
        }

        return null;
    }

    /**
     * * Localize item fields and return as plain array (for JSON response)
     */
    private function localizeItemArray(Model $item): array
    {
        $itemArray = $item->toArray();

        foreach ($itemArray as $key => $value) {
            if ($this->isLocalizedField($item, $key)) {
                $itemArray[$key] = $this->decodeLocalizedValue($item->getRawOriginal($key));
            }
        }

        return $itemArray;
    }

    /**
     * * Set a deeply nested value in an array using dot notation
     */
    protected function setNestedValue(array &$array, string $key, $value): void
    {
        if (! str_contains($key, '.')) {
            $array[$key] = $value;
            return;
        }

        $keys    = explode('.', $key);
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
}
