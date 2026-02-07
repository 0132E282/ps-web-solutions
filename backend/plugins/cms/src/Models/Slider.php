<?php

namespace PS0132E282\Cms\Models;

use PS0132E282\Core\Base\BaseModel;
use PS0132E282\Core\Cats\FileMedia;
use PS0132E282\Core\Cats\Localization;
use PS0132E282\Core\Cats\Property;

class Slider extends BaseModel
{
    protected $table = 'sliders';

    public function configs(): array
    {
        $slidersConfig = config('plugins.cms.sliders', []);
        $validLocations = implode(',', array_keys($slidersConfig));

        return [
            'title' => ['ui' => 'text', 'config' => ['validation' => 'required|max:255']],
            'image' => ['ui' => 'attachment', 'config' => ['validation' => 'required|exists:media,id']],
            'image_mobile' => ['ui' => 'attachment', 'config' => ['validation' => 'nullable|exists:media,id']],
            'link' => ['ui' => 'text', 'config' => ['validation' => 'nullable|max:255']],
            'status' => ['ui' => 'button-radio', 'config' => ['layout' => 'horizontal', 'options' => ['published' => 'Published', 'draft' => 'Draft'], 'validation' => 'required|in:published,draft']],
            'location' => ['ui' => 'select', 'config' => ['options' => $slidersConfig, 'validation' => "required|in:{$validLocations}"]],
            'position' => ['ui' => 'number', 'config' => ['validation' => 'nullable|integer']],
        ];
    }

    protected $fillable = [
        'title',
        'image',
        'image_mobile',
        'link',
        'status',
        'location',
        'position',
    ];

    protected $casts = [
        'title' => Localization::class,
        'image' => FileMedia::class,
        'image_mobile' => FileMedia::class,
        'property' => Property::class,
    ];
}
