<?php

namespace PS0132E282\Core\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use PS0132E282\Core\Base\Resource;
use Throwable;

class ItemController extends Controller
{
    /**
     * List items.
     */
    public function index(Request $request, string $resource): JsonResponse
    {
        try {
            $modelClass = $this->getModelForType($resource);
            if (! $modelClass) {
                return Resource::error("Resource '{$resource}' not found.", [], 404);
            }

            $query = $modelClass::query();

            // # Basic filtering based on request
            // * This can be expanded to use a dedicated Filter service/trait later if needed.

            $items = $query->paginate($request->input('per_page', 15));

            return Resource::items($items);
        } catch (Throwable $e) {
            return Resource::error($e->getMessage(), [], 500);
        }
    }

    /**
     * Submit (Create) a new item.
     */
    public function store(Request $request, string $resource): JsonResponse
    {
        try {
            // 1. Resolve Model
            $modelClass = $this->getModelForType($resource);
            if (! $modelClass) {
                return Resource::error("Resource '{$resource}' not found.", [], 404);
            }

            // 2. Validate
            $rules = $this->getValidationRules($modelClass);
            if (! empty($rules)) {
                $validator = Validator::make($request->all(), $rules);
                if ($validator->fails()) {
                    return response()->json(['errors' => $validator->errors()], 422);
                }
            }

            // 3. Create Item
            $item = $modelClass::create($request->all());

            // 4. Handle Specific Relationships
            // # NOTE: Automatic relationship syncing based on model inspection or conventions
            $this->syncRelationships($item, $request->all());

            return Resource::item($item);
        } catch (Throwable $e) {
            return Resource::error($e->getMessage(), [], 500);
        }
    }

    /**
     * Show a specific item.
     */
    public function show(string $resource, string $id): JsonResponse
    {
        try {
            $modelClass = $this->getModelForType($resource);
            if (! $modelClass) {
                return Resource::error("Resource '{$resource}' not found.", [], 404);
            }

            $query = $modelClass::query();

            // # Auto-eager load common relationships if they exist on the model
            $modelInstance = new $modelClass;
            if (method_exists($modelInstance, 'related_posts')) {
                $query->with('related_posts');
            }
            if (method_exists($modelInstance, 'categories')) {
                $query->with('categories');
            }
            if (method_exists($modelInstance, 'tags')) {
                $query->with('tags');
            }

            $item = $query->findOrFail($id);

            return Resource::item($item);
        } catch (Throwable $e) {
            return Resource::error($e->getMessage(), [], 404);
        }
    }

    /**
     * Resolve Model class from type string.
     * Uses the global model_class() helper.
     */
    protected function getModelForType(string $type): ?string
    {
        return model_class($type);
    }

    /**
     * Automatically sync relationships based on request data.
     *
     * @param  mixed  $item
     */
    protected function syncRelationships($item, array $data): void
    {
        foreach ($data as $key => $value) {
            if (method_exists($item, $key)) {
                $relation = $item->$key();
                if (
                    $relation instanceof \Illuminate\Database\Eloquent\Relations\BelongsToMany ||
                    $relation instanceof \Illuminate\Database\Eloquent\Relations\MorphToMany
                ) {
                    $item->$key()->sync($value);
                }
            }
        }
    }

    /**
     * Extract validation rules from Model configs.
     */
    protected function getValidationRules(string $modelClass): array
    {
        if (! method_exists($modelClass, 'configs')) {
            return [];
        }

        try {
            $model = new $modelClass;
            $configs = $model->configs();

            $rules = [];
            foreach ($configs as $field => $config) {
                if (isset($config['config']['validation'])) {
                    $rules[$field] = $config['config']['validation'];
                }
            }

            return $rules;
        } catch (Throwable $e) {
            return [];
        }
    }
}
