<?php

namespace PS0132E282\Core\Base;

use Illuminate\Database\Eloquent\Model;
use PS0132E282\Core\Observers\BaseObserver;

use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;

class BaseModel extends Model
{
    use LogsActivity;

    public $enableLogging = true;

    /**
     * Boot the model.
     */
    protected static function boot()
    {
        parent::boot();
        static::observe(BaseObserver::class);
    }

    public function getActivitylogOptions(): LogOptions
    {
        if (!$this->enableLogging) {
            return LogOptions::defaults()->logOnly([])->dontSubmitEmptyLogs();
        }

        return LogOptions::defaults()
            ->logAll()
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }
}
