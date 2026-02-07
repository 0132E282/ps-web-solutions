<?php

namespace PS0132E282\Core\Traits;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\Relations\MorphOne;

trait AutoTransform
{
    /**
     * Các trường mặc định sẽ bị loại bỏ
     */
    protected array $defaultExcludedFields = [
        'id',
        'created_at',
        'updated_at',
        'deleted_at',
    ];

    /**
     * Các trường tùy chỉnh sẽ bị loại bỏ (có thể override trong controller)
     */
    protected array $excludedFields = [];

    /**
     * Có tự động loại bỏ các mối quan hệ không
     */
    protected bool $excludeRelationships = true;

    /**
     * Tự động transform dữ liệu, loại bỏ các trường không cần thiết
     *
     * @param  mixed  $data  Model, Collection, Paginator hoặc array
     * @return mixed
     */
    protected function autoTransform($data)
    {
        if ($data instanceof LengthAwarePaginator) {
            // Transform paginated data
            /** @var \Illuminate\Pagination\LengthAwarePaginator $data */
            $collection = $data->getCollection();
            $transformedData = $collection->map(function ($item) {
                return $this->transformItem($item);
            });

            // Set transformed collection back to paginator
            $data->setCollection($transformedData);

            return $data;
        }

        if ($data instanceof Collection) {
            // Transform collection
            return $data->map(function ($item) {
                return $this->transformItem($item);
            });
        }

        if ($data instanceof Model) {
            // Transform single model
            return $this->transformItem($data);
        }

        if (is_array($data)) {
            // Transform array
            return array_map(function ($item) {
                if ($item instanceof Model) {
                    return $this->transformItem($item);
                }

                return $this->transformArray($item);
            }, $data);
        }

        return $data;
    }

    /**
     * Transform một item (Model hoặc array)
     *
     * @param  mixed  $item
     */
    protected function transformItem($item): array
    {
        if ($item instanceof Model) {
            $item = $item->toArray();
        }

        if (! is_array($item)) {
            return $item;
        }

        return $this->transformArray($item);
    }

    /**
     * Transform một mảng, loại bỏ các trường không cần thiết
     */
    protected function transformArray(array $data): array
    {
        $modelInstance = null;

        // Nếu có model property, lấy instance để kiểm tra relationships
        if (isset($this->model) && class_exists($this->model)) {
            $modelInstance = new $this->model;
        }

        // Merge excluded fields
        $excludedFields = array_unique(array_merge(
            $this->defaultExcludedFields,
            $this->excludedFields
        ));

        $transformed = [];

        foreach ($data as $key => $value) {
            // Bỏ qua các trường trong danh sách loại bỏ
            if (in_array($key, $excludedFields)) {
                continue;
            }

            // Nếu bật excludeRelationships, kiểm tra và loại bỏ relationships
            if ($this->excludeRelationships && $modelInstance) {
                if ($this->isRelationship($key, $modelInstance)) {
                    continue;
                }
            }

            // Xử lý nested arrays (có thể là relationships đã được load)
            if (is_array($value)) {
                // Kiểm tra nếu là relationship data (thường có cấu trúc đặc biệt)
                if ($this->isRelationshipData($key, $value, $modelInstance)) {
                    continue;
                }

                // Recursive transform cho nested arrays
                $value = $this->transformArray($value);
            }

            $transformed[$key] = $value;
        }

        return $transformed;
    }

    /**
     * Kiểm tra xem một key có phải là relationship không
     */
    protected function isRelationship(string $key, Model $modelInstance): bool
    {
        // Kiểm tra xem có method relationship không
        if (method_exists($modelInstance, $key)) {
            try {
                $relation = $modelInstance->$key();
                if ($relation instanceof \Illuminate\Database\Eloquent\Relations\Relation) {
                    return true;
                }
            } catch (\Exception $e) {
                // Nếu không phải relationship, bỏ qua
            }
        }

        return false;
    }

    /**
     * Lấy loại relationship
     */
    protected function getRelationshipType(string $key, Model $modelInstance): ?string
    {
        if (! method_exists($modelInstance, $key)) {
            return null;
        }

        try {
            $relation = $modelInstance->$key();

            if ($relation instanceof \Illuminate\Database\Eloquent\Relations\MorphOne) {
                return 'MorphOne';
            }

            if ($relation instanceof \Illuminate\Database\Eloquent\Relations\MorphMany) {
                return 'MorphMany';
            }

            if ($relation instanceof \Illuminate\Database\Eloquent\Relations\BelongsToMany) {
                return 'BelongsToMany';
            }

            if ($relation instanceof \Illuminate\Database\Eloquent\Relations\BelongsTo) {
                return 'BelongsTo';
            }

            if ($relation instanceof \Illuminate\Database\Eloquent\Relations\HasOne) {
                return 'HasOne';
            }

            if ($relation instanceof \Illuminate\Database\Eloquent\Relations\HasMany) {
                return 'HasMany';
            }
        } catch (\Exception $e) {
            // Nếu không phải relationship, trả về null
        }

        return null;
    }

    /**
     * Kiểm tra xem một mảng có phải là dữ liệu relationship không
     */
    protected function isRelationshipData(string $key, array $value, ?Model $modelInstance = null): bool
    {
        // Nếu có model instance, kiểm tra relationship
        if ($modelInstance && $this->isRelationship($key, $modelInstance)) {
            return true;
        }

        // Kiểm tra các dấu hiệu của relationship data
        // Thường relationship data sẽ có các key như 'id', 'created_at', etc.
        // và có cấu trúc giống model data
        if (isset($value['id']) && count($value) > 1) {
            // Có thể là relationship, nhưng cần kiểm tra thêm
            // Nếu có các trường timestamp, có thể là relationship
            if (isset($value['created_at']) || isset($value['updated_at'])) {
                return true;
            }
        }

        return false;
    }

    /**
     * Lấy danh sách các trường sẽ bị loại bỏ
     */
    protected function getExcludedFields(): array
    {
        return array_unique(array_merge(
            $this->defaultExcludedFields,
            $this->excludedFields
        ));
    }

    /**
     * Thêm trường vào danh sách loại bỏ
     *
     * @param  string|array  $fields
     */
    protected function addExcludedFields($fields): void
    {
        $fields = is_array($fields) ? $fields : [$fields];
        $this->excludedFields = array_unique(array_merge($this->excludedFields, $fields));
    }

    /**
     * Xóa trường khỏi danh sách loại bỏ
     *
     * @param  string|array  $fields
     */
    protected function removeExcludedFields($fields): void
    {
        $fields = is_array($fields) ? $fields : [$fields];
        $this->excludedFields = array_diff($this->excludedFields, $fields);
    }

    /**
     * Bật/tắt việc loại bỏ relationships
     */
    protected function setExcludeRelationships(bool $exclude): void
    {
        $this->excludeRelationships = $exclude;
    }

    /**
     * Transform request data để loại bỏ các trường không cần thiết và nhóm relationships
     * Sử dụng cho create và update
     */
    protected function autoTransformRequest(array $data): array
    {
        $modelInstance = null;

        // Nếu có model property, lấy instance để kiểm tra relationships
        if (isset($this->model) && class_exists($this->model)) {
            $modelInstance = new $this->model;
        }

        // Merge excluded fields
        $excludedFields = array_unique(array_merge(
            $this->defaultExcludedFields,
            $this->excludedFields
        ));

        $transformed = [];
        $relationships = [];

        foreach ($data as $key => $value) {
            // Bỏ qua các trường trong danh sách loại bỏ
            if (in_array($key, $excludedFields)) {
                continue;
            }

            // Kiểm tra nếu là relationship
            if ($modelInstance && $this->isRelationship($key, $modelInstance)) {
                // Lấy loại relationship để xử lý phù hợp
                $relationType = $this->getRelationshipType($key, $modelInstance);

                // MorphOne và MorphMany: giữ nguyên associative array (field data)
                // BelongsToMany: normalize thành array of IDs
                // BelongsTo: giữ nguyên single value
                if ($relationType === 'MorphOne' || $relationType === 'MorphMany') {
                    $relationships[$key] = is_array($value) ? $value : [];
                } elseif ($relationType === 'BelongsToMany') {
                    $relationships[$key] = $this->normalizeRelationshipValue($value);
                } else {
                    // BelongsTo, HasOne, HasMany: giữ nguyên giá trị
                    $relationships[$key] = $value;
                }

                continue;
            }

            // Xử lý các trường relationship có thể được gửi dưới dạng array of objects
            // Ví dụ: roles_data, permissions_data, etc.
            if (str_ends_with($key, '_data') && is_array($value)) {
                // Đây có thể là relationship data dạng full objects
                // Loại bỏ và chỉ giữ lại key gốc (nếu có)
                $baseKey = str_replace('_data', '', $key);
                if ($modelInstance && $this->isRelationship($baseKey, $modelInstance)) {
                    // Nếu có key gốc (ví dụ: roles) thì bỏ qua _data
                    if (! isset($data[$baseKey])) {
                        // Nếu không có key gốc, extract IDs từ _data
                        $relationships[$baseKey] = $this->extractIdsFromRelationshipData($value);
                    }

                    continue;
                }
            }

            // Xử lý nested arrays (có thể là nested relationships)
            if (is_array($value)) {
                // Kiểm tra nếu là array of objects (có thể là relationship data)
                if ($this->isArrayOfObjects($value)) {
                    // Có thể là relationship data, kiểm tra xem có key tương ứng không
                    $possibleRelationKey = $key;
                    if ($modelInstance && $this->isRelationship($possibleRelationKey, $modelInstance)) {
                        $relationships[$possibleRelationKey] = $this->extractIdsFromRelationshipData($value);

                        continue;
                    }
                }

                // Recursive transform cho nested arrays thông thường
                $value = $this->transformRequestArray($value);
            }

            $transformed[$key] = $value;
        }

        // Merge relationships vào transformed data
        // Relationships sẽ được xử lý riêng trong controller (sync, attach, etc.)
        foreach ($relationships as $key => $value) {
            $transformed[$key] = $value;
        }

        return $transformed;
    }

    /**
     * Transform nested array trong request
     */
    protected function transformRequestArray(array $data): array
    {
        $transformed = [];

        foreach ($data as $key => $value) {
            if (is_array($value)) {
                $transformed[$key] = $this->transformRequestArray($value);
            } else {
                $transformed[$key] = $value;
            }
        }

        return $transformed;
    }

    /**
     * Chuẩn hóa giá trị relationship
     * Chuyển đổi các dạng khác nhau thành array of IDs
     *
     * @param  mixed  $value
     */
    protected function normalizeRelationshipValue($value): array
    {
        if (is_array($value)) {
            // Nếu là array of IDs
            if ($this->isArrayOfIds($value)) {
                return array_values(array_filter($value));
            }

            // Nếu là array of objects, extract IDs
            if ($this->isArrayOfObjects($value)) {
                return $this->extractIdsFromRelationshipData($value);
            }
        }

        // Nếu là single value, convert to array
        if ($value !== null && $value !== '') {
            return [(int) $value];
        }

        return [];
    }

    /**
     * Kiểm tra xem array có phải là array of IDs không
     */
    protected function isArrayOfIds(array $array): bool
    {
        if (empty($array)) {
            return true;
        }

        foreach ($array as $item) {
            if (! is_numeric($item) && ! is_int($item)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Kiểm tra xem array có phải là array of objects không
     */
    protected function isArrayOfObjects(array $array): bool
    {
        if (empty($array)) {
            return false;
        }

        foreach ($array as $item) {
            if (! is_array($item)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Extract IDs từ relationship data (array of objects)
     */
    protected function extractIdsFromRelationshipData(array $data): array
    {
        $ids = [];

        foreach ($data as $item) {
            if (is_array($item)) {
                // Nếu có key 'id'
                if (isset($item['id'])) {
                    $ids[] = (int) $item['id'];
                }
                // Nếu là associative array với key là ID
                elseif (count($item) === 1 && isset($item[0])) {
                    $ids[] = (int) $item[0];
                }
            } elseif (is_numeric($item)) {
                $ids[] = (int) $item;
            }
        }

        return array_values(array_unique(array_filter($ids)));
    }
}
