<?php

namespace PS0132E282\Cms\Models;

use PS0132E282\Core\Base\BaseModel;
use PS0132E282\Core\Cats\Localization;

class Menu extends BaseModel
{
    protected $table = 'menus';

    const TYPE_TEXT = 'text';

    const TYPE_LINK = 'link';

    const TYPE_ROUTE = 'route';

    const LINK_TYPE = [
        self::TYPE_TEXT => 'Text',
        self::TYPE_LINK => 'Link',
        self::TYPE_ROUTE => 'Route',
    ];

    const STATUS = [
        'published' => 'Published',
        'draft' => 'Draft',
    ];

    public function configs(): array
    {
        $menusConfig = config('plugins.cms.menus.location', []);
        $validLocations = implode(',', array_keys($menusConfig));

        return [
            'title' => ['ui' => 'text', 'config' => ['validation' => 'required|max:255']],
            'location' => ['ui' => 'select', 'config' => ['options' => $menusConfig, 'validation' => "required|in:{$validLocations}"]],
            'type' => ['ui' => 'select', 'config' => ['options' => self::LINK_TYPE, 'validation' => 'required|in:text,link,route']],
            'value' => ['ui' => 'text', 'config' => ['validation' => 'nullable|max:255', 'placeholder' => 'URL or Route name']],
            'parent' => ['ui' => 'select', 'config' => ['source' => ['route' => 'admin.menus.index', 'params' => ['fields' => ['id', 'title']], 'valueKey' => 'id', 'labelKey' => 'title'], 'validation' => 'nullable|exists:menus,id']],
            'position' => ['ui' => 'number', 'config' => ['validation' => 'required|integer']],
            'status' => ['ui' => 'button-radio', 'config' => ['options' => self::STATUS, 'validation' => 'required|in:published,draft']],
        ];
    }

    protected $fillable = [
        'title',
        'location',
        'type',
        'value',
        'parent_id',
        'position',
        'status',
    ];

    protected $casts = [
        'title' => Localization::class,
        'parent_id' => 'integer',
        'position' => 'integer',
    ];

    public function children()
    {
        return $this->hasMany(Menu::class, 'parent_id')->orderBy('position');
    }

    public function parent()
    {
        return $this->belongsTo(Menu::class, 'parent_id');
    }
}
