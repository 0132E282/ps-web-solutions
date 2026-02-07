<?php

namespace PS0132E282\Core\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Seo extends Model
{
    use HasFactory;

    protected $table = 'seos';

    protected static array $configs = [
        'title' => ['ui' => 'text', 'config' => ['validation' => 'required|max:255']],
        'image' => ['ui' => 'attachment', 'config' => ['validation' => 'required|exists:media,id']],
        'slug' => ['ui' => 'slug', 'config' => ['validation' => 'required|max:255']],
        'description' => ['ui' => 'textarea', 'config' => ['validation' => 'required|max:255']],
        'keywords' => ['ui' => 'text', 'config' => ['validation' => 'required|max:255']],
        'canonical_url' => ['ui' => 'text', 'config' => ['validation' => 'required|max:255']],
    ];

    public static function configsSingleCondition(): array
    {
        return [
            'ui' => 'single-condition',
            'config' => [
                'label' => 'SEO Settings',
                'validation' => 'required',
                'header-items' => [
                    'title' => self::$configs['title'],
                ],
                'items' => [
                    'image' => self::$configs['image'],
                    'description' => self::$configs['description'],
                    'keywords' => self::$configs['keywords'],
                    'canonical_url' => self::$configs['canonical_url'],
                ],
            ],
        ];
    }

    protected $fillable = [
        'seoable_type',
        'seoable_id',
        'title',
        'slug',
        'description',
        'keywords',
        'image',
        'canonical_url',
        'og_title',
        'og_description',
        'og_image',
        'og_type',
        'og_url',
        'og_site_name',
        'twitter_card',
        'twitter_title',
        'twitter_description',
        'twitter_image',
        'twitter_site',
        'twitter_creator',
        'robots',
        'meta_robots_advanced',
        'schema_markup',
        'focus_keyword',
    ];

    protected $casts = [
        'title' => 'array',
        'slug' => 'array',
        'description' => 'array',
        'keywords' => 'array',
        'image' => 'array',
        'canonical_url' => 'array',
        'og_title' => 'array',
        'og_description' => 'array',
        'og_image' => 'array',
        'og_url' => 'array',
        'twitter_title' => 'array',
        'twitter_description' => 'array',
        'twitter_image' => 'array',
        'meta_robots_advanced' => 'array',
        'schema_markup' => 'array',
        'focus_keyword' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the parent seoable model.
     */
    public function seoable(): MorphTo
    {
        return $this->morphTo();
    }
}
