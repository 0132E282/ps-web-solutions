<?php

namespace App\Models\Content;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use PS0132E282\Core\Base\BaseModel;

class Post extends BaseModel
{
  public function configs(): array
  {
    return [
      'name' => ['ui' => 'text', 'config' => ['validation' => 'required|max:255', 'placeholder' => 'e.g. Electronics']],
      'slug' => ['ui' => 'text', 'config' => ['validation' => 'required|max:255|unique:taxonomies,slug,' . ($this->id ?? 'NULL') . ',id', 'placeholder' => 'e.g. electronics']],
      'description' => ['ui' => 'textarea', 'config' => ['validation' => 'nullable|max:255', 'placeholder' => 'e.g. Electronics category']],
      'content' => ['ui' => 'editor', 'config' => ['validation' => 'nullable|max:255', 'placeholder' => 'e.g. Electronics category']],
      'image' => ['ui' => 'attachment', 'config' => ['validation' => 'nullable|image|max:2048', 'placeholder' => 'e.g. electronics.jpg']],
      'status' => ['ui' => 'button-radio', 'config' => ['options' => [['label' => 'Published', 'value' => 'published'], ['label' => 'Draft', 'value' => 'draft']], 'validation' => 'required|in:published,draft']],
      'parent' => ['ui' => 'select', 'config' => ['options' => [['label' => 'Published', 'value' => 'published'], ['label' => 'Draft', 'value' => 'draft']], 'validation' => 'required|in:published,draft']],
      'related_posts' => ['ui' => 'multiple-select', 'config' => ['options' => [['label' => 'Published', 'value' => 'published'], ['label' => 'Draft', 'value' => 'draft']], 'validation' => 'required|in:published,draft']],
      'categories' => ['ui' => 'multiple-select', 'config' => ['options' => [['label' => 'Published', 'value' => 'published'], ['label' => 'Draft', 'value' => 'draft']], 'validation' => 'required|in:published,draft']],
      'is_featured' => ['ui' => 'checkbox', 'config' => ['validation' => 'required|in:published,draft']],
      'featured_position' => ['ui' => 'number', 'config' => ['validation' => 'required|in:published,draft']],
      'published_at' => ['ui' => 'date', 'config' => ['validation' => 'required|in:published,draft']],
    ];
  }

  protected $fillable = [
    'name',
    'slug',
    'description',
    'image',
    'status',
    'content',
  ];

  public function categories()
  {
    return $this->belongsToMany(PostCategory::class, 'post_categories', 'post_id', 'category_id');
  }

  public function related_posts()
  {
    return $this->belongsToMany(Post::class, 'post_related', 'post_id', 'related_id');
  }
}
