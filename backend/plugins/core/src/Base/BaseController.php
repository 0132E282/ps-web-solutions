<?php

namespace PS0132E282\Core\Base;

use App\Http\Controllers\Controller;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use PS0132E282\Core\Base\Resource;
use PS0132E282\Core\Traits\AutoTransform;
use PS0132E282\Core\Traits\HasCrudAction;
use PS0132E282\Core\Traits\HasDashboardStats;
use PS0132E282\Core\Traits\HasDataPreparation;
use PS0132E282\Core\Traits\HasDuplication;
use PS0132E282\Core\Traits\HasFieldDetection;
use PS0132E282\Core\Traits\HasFormConfig;
use PS0132E282\Core\Traits\HasLocalization;
use PS0132E282\Core\Traits\HasModelResolver;
use PS0132E282\Core\Traits\HasResponse;
use PS0132E282\Core\Traits\HasTransformation;
use PS0132E282\Core\Traits\HasValidation;
use PS0132E282\Core\Traits\HasViewConfigs;
use PS0132E282\Core\Traits\Relationships;

class BaseController extends Controller
{
    use AutoTransform, HasDuplication, HasFormConfig, HasFieldDetection, HasCrudAction, Relationships {
        Relationships::isRelationship insteadof AutoTransform;
    }
    use HasLocalization, HasModelResolver, HasValidation;
    use HasDashboardStats, HasResponse, HasTransformation, HasDataPreparation, HasViewConfigs;

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
        $viewConfig = $this->getViewConfig('index');
        $layout = request()->query('layout') ?: (($viewConfig['config']['layouts'] ?? $viewConfig['layouts'] ?? [])[0] ?? 'table');

        $isTreeMode = ($layout === 'tree');
        $items = $this->loadItems();
        $itemsArray = $this->transformItemsForView($items, 'index');

        if (request()->wantsJson()) {
            return Resource::items($itemsArray, $this->buildPaginationMeta($items));
        }

        $extra = [
            'items' => $itemsArray,
            ...$this->buildPaginationMeta($items),
        ];

        if ($isTreeMode) {
            return $this->renderInertia('tree', array_merge($extra, [
                'form_views' => $this->getViewsConfig('form'),
            ]));
        }

        return $this->renderInertia('index', $extra);
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
}
