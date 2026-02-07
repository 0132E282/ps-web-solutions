<?php

namespace PS0132E282\Core\Cats;

use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class SlugField implements CastsAttributes
{
    /**
     * Transform the attribute from the underlying model values.
     */
    public function get(Model $model, string $key, mixed $value, array $attributes): string|array|null
    {
        if (is_null($value)) {
            return null;
        }

        // Nếu là JSON string (Localization format), decode và trả về array
        if (is_string($value)) {
            $decoded = json_decode($value, true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                return $decoded;
            }

            return $value;
        }

        // Nếu là array, trả về array
        if (is_array($value)) {
            return $value;
        }

        return (string) $value;
    }

    /**
     * Transform the attribute to its underlying model values.
     * Tự động tạo slug từ title hoặc name nếu slug trống.
     * Slug sẽ đa ngữ nếu title/name dùng Localization cast.
     * Nếu slug trùng thì thêm số đằng sau.
     */
    public function set(Model $model, string $key, mixed $value, array $attributes): string
    {
        // Kiểm tra xem source field (title/name) có dùng Localization không
        $isMultilingual = $this->isSourceMultilingual($model);

        // Nếu đã có slug và không rỗng
        if (! empty($value)) {
            // Nếu là string không rỗng hoặc array không rỗng
            if (is_string($value) && trim($value) !== '') {
                if ($isMultilingual) {
                    // Xử lý slug đa ngữ
                    return $this->handleMultilingualSlug($model, $key, $value, $attributes);
                } else {
                    return $this->ensureUnique($model, $key, $value, $attributes);
                }
            }

            if (is_array($value) && ! empty($value)) {
                if ($isMultilingual) {
                    return $this->handleMultilingualSlug($model, $key, $value, $attributes);
                } else {
                    // Nếu là array nhưng không phải multilingual, lấy giá trị đầu tiên
                    $firstValue = reset($value);
                    if (! empty($firstValue) && is_string($firstValue)) {
                        return $this->ensureUnique($model, $key, $firstValue, $attributes);
                    }
                }
            }
        }

        // Nếu slug trống hoặc null, tự động generate từ title hoặc name
        if ($isMultilingual) {
            $generated = $this->generateMultilingualSlug($model, $key, $attributes);

            // Nếu không generate được, trả về empty JSON object
            return $generated !== '{}' ? $generated : '{}';
        } else {
            $generated = $this->generateSimpleSlug($model, $key, $attributes);

            // Nếu không generate được, trả về empty string (sẽ được set default trong migration)
            return $generated ?: '';
        }
    }

    /**
     * Kiểm tra xem source field (title/name) có dùng Localization cast không.
     */
    protected function isSourceMultilingual(Model $model): bool
    {
        $casts = $model->getCasts();

        // Kiểm tra title hoặc name có dùng Localization không
        if (isset($casts['title']) && $casts['title'] === Localization::class) {
            return true;
        }

        if (isset($casts['name']) && $casts['name'] === Localization::class) {
            return true;
        }

        return false;
    }

    /**
     * Lấy source field name (title hoặc name) từ model casts.
     */
    protected function getSourceFieldName(Model $model): string
    {
        $casts = $model->getCasts();

        // Ưu tiên title, sau đó name
        if (isset($casts['title'])) {
            return 'title';
        }

        if (isset($casts['name'])) {
            return 'name';
        }

        return 'title'; // Default
    }

    /**
     * Tạo slug đơn ngữ (string).
     */
    protected function generateSimpleSlug(Model $model, string $key, array $attributes): string
    {
        $sourceField = $this->getSourceFieldName($model);

        // Lấy từ attributes parameter trước, sau đó từ model
        $sourceValue = $this->extractSimpleValue($attributes, $sourceField);

        if (empty($sourceValue)) {
            // Thử lấy từ model attributes
            $modelValue = $model->getAttribute($sourceField);
            if (! empty($modelValue) && is_string($modelValue)) {
                $sourceValue = $modelValue;
            }
        }

        if (empty($sourceValue)) {
            // Thử field còn lại nếu field đầu không có
            $otherField = $sourceField === 'title' ? 'name' : 'title';
            $sourceValue = $this->extractSimpleValue($attributes, $otherField);

            if (empty($sourceValue)) {
                $modelValue = $model->getAttribute($otherField);
                if (! empty($modelValue) && is_string($modelValue)) {
                    $sourceValue = $modelValue;
                }
            }
        }

        if (empty($sourceValue)) {
            return $attributes[$key] ?? '';
        }

        $slug = Str::slug($sourceValue);

        return $this->ensureUnique($model, $key, $slug, $attributes);
    }

    /**
     * Tạo slug đa ngữ (JSON format).
     */
    protected function generateMultilingualSlug(Model $model, string $key, array $attributes): string
    {
        $sourceField = $this->getSourceFieldName($model);

        // Lấy từ attributes parameter trước, sau đó từ model
        $sourceData = $this->extractMultilingualValue($attributes, $sourceField);

        if (empty($sourceData)) {
            // Thử lấy từ model attributes
            $modelValue = $model->getAttribute($sourceField);
            if (! empty($modelValue)) {
                if (is_string($modelValue)) {
                    $decoded = json_decode($modelValue, true);
                    if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                        $sourceData = $decoded;
                    }
                } elseif (is_array($modelValue)) {
                    $sourceData = $modelValue;
                }
            }
        }

        if (empty($sourceData)) {
            // Thử field còn lại nếu field đầu không có
            $otherField = $sourceField === 'title' ? 'name' : 'title';
            $sourceData = $this->extractMultilingualValue($attributes, $otherField);

            if (empty($sourceData)) {
                $modelValue = $model->getAttribute($otherField);
                if (! empty($modelValue)) {
                    if (is_string($modelValue)) {
                        $decoded = json_decode($modelValue, true);
                        if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                            $sourceData = $decoded;
                        }
                    } elseif (is_array($modelValue)) {
                        $sourceData = $modelValue;
                    }
                }
            }
        }

        if (empty($sourceData)) {
            return $attributes[$key] ?? '{}';
        }

        // Tạo slug cho từng locale
        $slugs = [];
        foreach ($sourceData as $locale => $value) {
            if (! empty($value) && is_string($value)) {
                $slug = Str::slug($value);
                // Đảm bảo unique cho từng locale
                $slugs[$locale] = $this->ensureUniqueMultilingual($model, $key, $slug, $locale, $attributes);
            }
        }

        return $this->encodeJson($slugs);
    }

    /**
     * Xử lý slug đa ngữ khi đã có giá trị.
     */
    protected function handleMultilingualSlug(Model $model, string $key, mixed $value, array $attributes): string
    {
        // Nếu là JSON string, decode
        if (is_string($value)) {
            $decoded = json_decode($value, true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                $value = $decoded;
            } else {
                // Nếu không phải JSON, tạo slug đa ngữ từ giá trị này
                return $this->generateMultilingualSlug($model, $key, $attributes);
            }
        }

        // Nếu là array, đảm bảo unique cho từng locale
        if (is_array($value)) {
            $slugs = [];
            foreach ($value as $locale => $slug) {
                if (! empty($slug) && is_string($slug)) {
                    $slugs[$locale] = $this->ensureUniqueMultilingual($model, $key, $slug, $locale, $attributes);
                }
            }

            return $this->encodeJson($slugs);
        }

        return $this->generateMultilingualSlug($model, $key, $attributes);
    }

    /**
     * Extract giá trị đơn ngữ từ attributes.
     */
    protected function extractSimpleValue(array $attributes, string $key): string
    {
        if (! isset($attributes[$key])) {
            return '';
        }

        $value = $attributes[$key];

        if (is_string($value)) {
            return $value;
        }

        return '';
    }

    /**
     * Extract giá trị đa ngữ từ attributes (Localization format).
     */
    protected function extractMultilingualValue(array $attributes, string $key): array
    {
        if (! isset($attributes[$key])) {
            return [];
        }

        $value = $attributes[$key];

        // Nếu là JSON string (Localization), decode
        if (is_string($value)) {
            $decoded = json_decode($value, true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                return $decoded;
            }

            return [];
        }

        // Nếu là array, trả về
        if (is_array($value)) {
            return $value;
        }

        return [];
    }

    /**
     * Đảm bảo slug đơn ngữ là unique, nếu trùng thì thêm số đằng sau.
     */
    protected function ensureUnique(Model $model, string $key, string $slug, array $attributes): string
    {
        if (empty($slug)) {
            return '';
        }

        $originalSlug = $slug;
        $counter = 1;
        $modelId = $attributes['id'] ?? $model->id ?? null;

        // Query builder để check unique
        $query = $model->newQuery()->where($key, $slug);

        // Loại trừ chính record hiện tại nếu đang update
        if ($modelId) {
            $query->where('id', '!=', $modelId);
        }

        // Nếu slug đã tồn tại, thêm số đằng sau
        while ($query->exists()) {
            $slug = $originalSlug.'-'.$counter;
            $counter++;

            $query = $model->newQuery()->where($key, $slug);
            if ($modelId) {
                $query->where('id', '!=', $modelId);
            }
        }

        return $slug;
    }

    /**
     * Đảm bảo slug đa ngữ là unique cho từng locale.
     */
    protected function ensureUniqueMultilingual(Model $model, string $key, string $slug, string $locale, array $attributes): string
    {
        if (empty($slug)) {
            return '';
        }

        $originalSlug = $slug;
        $counter = 1;
        $modelId = $attributes['id'] ?? $model->id ?? null;

        // Lấy tất cả records có slug field, decode và check trong PHP
        // Cách này an toàn hơn với mọi database
        $query = $model->newQuery();

        // Loại trừ chính record hiện tại nếu đang update
        if ($modelId) {
            $query->where('id', '!=', $modelId);
        }

        // Lấy tất cả records và check trong PHP
        $existingRecords = $query->get([$key, 'id']);

        // Kiểm tra xem slug đã tồn tại chưa
        while ($this->slugExistsInRecords($existingRecords, $key, $slug, $locale)) {
            $slug = $originalSlug.'-'.$counter;
            $counter++;
        }

        return $slug;
    }

    /**
     * Kiểm tra xem slug có tồn tại trong records không.
     *
     * @param  \Illuminate\Database\Eloquent\Collection  $records
     */
    protected function slugExistsInRecords($records, string $key, string $slug, string $locale): bool
    {
        foreach ($records as $record) {
            $value = $record->getAttribute($key);

            if (empty($value)) {
                continue;
            }

            // Decode JSON nếu là string
            if (is_string($value)) {
                $decoded = json_decode($value, true);
                if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                    $value = $decoded;
                } else {
                    continue;
                }
            }

            // Kiểm tra slug trong locale
            if (is_array($value) && isset($value[$locale]) && $value[$locale] === $slug) {
                return true;
            }
        }

        return false;
    }

    /**
     * Encode array to JSON string (tương tự Localization).
     */
    protected function encodeJson(array $value): string
    {
        return json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }
}
