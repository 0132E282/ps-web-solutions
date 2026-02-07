<?php

namespace PS0132E282\Core\Traits;

use Illuminate\Database\Eloquent\Relations\MorphOne;
use PS0132E282\Core\Models\Seo;

trait HasSeo
{
    protected string $seo = Seo::class;

    public function seo(): MorphOne
    {
        return $this->morphOne($this->seo, 'seoable');
    }

    /**
     * Sync seo data.
     */
    public function syncSeo(array $seoData): void
    {
        if (empty($seoData)) {
            return;
        }

        $existingSeo = $this->seo()->first();

        if ($existingSeo) {
            \Illuminate\Database\Eloquent\Model::withoutEvents(function () use ($existingSeo, $seoData) {
                $existingSeo->update($seoData);
            });
        } else {
            $model = $this;
            \Illuminate\Database\Eloquent\Model::withoutEvents(function () use ($model, $seoData) {
                $model->seo()->create($seoData);
            });
        }
    }
}
