<?php

namespace PS0132E282\Core\Base;

use Illuminate\Database\Eloquent\Model;
use PS0132E282\Core\Observers\BaseObserver;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class BaseModel extends Model
{
    use LogsActivity;

    public $enableLogging = true;

    const STATUS_PUBLISHED = 'published';

    const STATUS_DRAFT = 'draft';

    const STATUS = [
        self::STATUS_PUBLISHED => 'Published',
        self::STATUS_DRAFT => 'Draft',
    ];

    protected static function boot()
    {
        parent::boot();
        static::observe(BaseObserver::class);
    }

    public function getActivitylogOptions(): LogOptions
    {
        if (! $this->enableLogging) {
            return LogOptions::defaults()->logOnly([])->dontSubmitEmptyLogs();
        }

        return LogOptions::defaults()
            ->logAll()
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }

    /**
     * Override relationship methods to support model overrides
     */
    public function hasMany($related, $foreignKey = null, $localKey = null)
    {
        return parent::hasMany(model_class(class: $related), $foreignKey, $localKey);
    }

    public function belongsTo($related, $foreignKey = null, $ownerKey = null, $relation = null)
    {
        return parent::belongsTo(model_class(class: $related), $foreignKey, $ownerKey, $relation);
    }

    public function belongsToMany($related, $table = null, $foreignPivotKey = null, $relatedPivotKey = null, $parentKey = null, $relatedKey = null, $relation = null)
    {
        return parent::belongsToMany(model_class(class: $related), $table, $foreignPivotKey, $relatedPivotKey, $parentKey, $relatedKey, $relation);
    }

    public function hasOne($related, $foreignKey = null, $localKey = null)
    {
        return parent::hasOne(model_class(class: $related), $foreignKey, $localKey);
    }

    public function morphTo($name = null, $type = null, $id = null, $ownerKey = null)
    {
        return parent::morphTo($name, $type, $id, $ownerKey);
    }

    public function morphMany($related, $name, $type = null, $id = null, $localKey = null)
    {
        return parent::morphMany(model_class(class: $related), $name, $type, $id, $localKey);
    }

    public function morphOne($related, $name, $type = null, $id = null, $localKey = null)
    {
        return parent::morphOne(model_class(class: $related), $name, $type, $id, $localKey);
    }

    public function morphToMany($related, $name, $table = null, $foreignPivotKey = null, $relatedPivotKey = null, $parentKey = null, $relatedKey = null, $relation = null, $inverse = false)
    {
        return parent::morphToMany(model_class(class: $related), $name, $table, $foreignPivotKey, $relatedPivotKey, $parentKey, $relatedKey, $relation, $inverse);
    }

    public function morphedByMany($related, $name, $table = null, $foreignPivotKey = null, $relatedPivotKey = null, $parentKey = null, $relatedKey = null, $relation = null)
    {
        return parent::morphedByMany(model_class(class: $related), $name, $table, $foreignPivotKey, $relatedPivotKey, $parentKey, $relatedKey, $relation);
    }
}
