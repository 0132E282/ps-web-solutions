<?php

namespace App\Models\Content;

use PS0132E282\Core\Base\BaseModel;
use PS0132E282\Cms\Models\PostCategory;
use PS0132E282\Core\Cats\Localization;
use PS0132E282\Core\Cats\SlugField;
use PS0132E282\Core\Cats\FileMedia;

class Post extends BaseModel
{
  public function configs(): array
  {
    return [
      'title' => ['ui' => 'text', 'config' => ['validation' => 'required|max:255', 'placeholder' => 'e.g. Electronics']],
      'slug' => ['ui' => 'text', 'config' => ['validation' => 'required|max:255|unique:taxonomies,slug,' . ($this->id ?? 'NULL') . ',id', 'placeholder' => 'e.g. electronics']],
      'description' => ['ui' => 'textarea', 'config' => ['validation' => 'nullable|max:255', 'placeholder' => 'e.g. Electronics category']],
      'content' => ['ui' => 'editor', 'config' => ['validation' => 'nullable|max:255', 'placeholder' => 'e.g. Electronics category']],
      'image' => ['ui' => 'attachment', 'config' => ['validation' => 'nullable|image|max:2048', 'placeholder' => 'e.g. electronics.jpg']],
      'status' => ['ui' => 'button-radio', 'config' => ['options' => [['label' => 'Published', 'value' => 'published'], ['label' => 'Draft', 'value' => 'draft']], 'validation' => 'required|in:published,draft']],
      'related_posts' => ['ui' => 'multiple-select', 'config' => ['options' => [['label' => 'Published', 'value' => 'published'], ['label' => 'Draft', 'value' => 'draft']], 'validation' => 'required|in:published,draft']],
      'categories' => ['ui' => 'multiple-select', 'config' => ['options' => [['label' => 'Published', 'value' => 'published'], ['label' => 'Draft', 'value' => 'draft']], 'validation' => 'required|in:published,draft']],
      'is_featured' => ['ui' => 'checkbox', 'config' => ['validation' => 'required|in:published,draft']],
      'featured_position' => ['ui' => 'number', 'config' => ['validation' => 'required|in:published,draft']],
      'published_at' => ['ui' => 'date', 'config' => ['validation' => 'required|in:published,draft']],
    ];
  }

  protected $fillable = [
    'title',
    'slug',
    'description',
    'image',
    'status',
    'content',
    'is_featured',
    'featured_position',
    'published_at'
  ];

  protected $casts = [
    'title' => Localization::class,
    'slug' => SlugField::class,
    'description' => Localization::class,
    'content' => Localization::class,
    'is_featured' => 'boolean',
    'featured_position' => Localization::class,
    'published_at' => Localization::class,
    'image' => FileMedia::class,
  ];

  public function categories()
  {
    return $this->morphToMany(PostCategory::class, 'taxonomable', 'taxonomables', 'taxonomable_id', 'taxonomy_id');
  }

  public function related_posts()
  {
    return $this->belongsToMany(self::class, 'post_ref_related_posts', 'post_id', 'related_post_id');
  }
}
