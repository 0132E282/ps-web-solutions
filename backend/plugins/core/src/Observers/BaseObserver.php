<?php

namespace PS0132E282\Core\Observers;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Schema;
use PS0132E282\Core\Cats\SlugField;

class BaseObserver
{
    /**
     * Handle the model "creating" event.
     */
    public function creating(Model $model): void
    {
        $this->autoGenerateSlug($model);
    }

    /**
     * Handle the model "updating" event.
     */
    public function updating(Model $model): void
    {
        if ($this->shouldRegenerateSlug($model)) {
            $this->autoGenerateSlug($model);
        }

        if (Schema::hasColumn($model->getTable(), 'published_at') &&
            $model->status === 'published'
            && empty($model->published_at)
        ) {
            $model->published_at = now();
        }
    }

    /**
     * Tự động tạo slug nếu model có dùng SlugField cast và slug trống.
     */
    protected function autoGenerateSlug(Model $model): void
    {
        $casts = $model->getCasts();

        // Kiểm tra xem model có dùng SlugField cast không
        $slugField = null;
        foreach ($casts as $field => $cast) {
            if ($cast === SlugField::class) {
                $slugField = $field;
                break;
            }

            // Kiểm tra nếu là string class name
            if (is_string($cast) && class_exists($cast)) {
                $reflection = new \ReflectionClass($cast);
                if ($reflection->getName() === SlugField::class || $reflection->isSubclassOf(SlugField::class)) {
                    $slugField = $field;
                    break;
                }
            }
        }

        if (! $slugField) {
            return;
        }

        // Nếu slug chưa được set hoặc trống, set null để trigger cast set() method
        if (! isset($model->attributes[$slugField]) || empty($model->attributes[$slugField])) {
            $model->setAttribute($slugField, null);
        }
    }

    /**
     * Kiểm tra xem có nên regenerate slug không.
     */
    protected function shouldRegenerateSlug(Model $model): bool
    {
        // Chỉ regenerate nếu slug trống và title/name thay đổi
        $casts = $model->getCasts();

        // Kiểm tra xem có SlugField cast không và lấy field name
        $slugField = null;
        foreach ($casts as $field => $cast) {
            if ($cast === SlugField::class) {
                $slugField = $field;
                break;
            }

            // Kiểm tra nếu là string class name
            if (is_string($cast) && class_exists($cast)) {
                $reflection = new \ReflectionClass($cast);
                if ($reflection->getName() === SlugField::class || $reflection->isSubclassOf(SlugField::class)) {
                    $slugField = $field;
                    break;
                }
            }
        }

        if (! $slugField) {
            return false;
        }

        // Kiểm tra xem slug có trống không
        $slugValue = $model->getAttribute($slugField);
        if (! empty($slugValue)) {
            return false;
        }

        // Kiểm tra xem title hoặc name có thay đổi không
        return $model->isDirty('title') || $model->isDirty('name');
    }
}
