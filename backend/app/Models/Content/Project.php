<?php

namespace App\Models\Content;

use PS0132E282\Core\Base\BaseModel;

class Project extends BaseModel
{
  public function configs(): array
  {
    return [
      'name' => ['ui' => 'text', 'config' => ['validation' => 'required|max:255', 'placeholder' => 'e.g. Electronics']],
      'slug' => ['ui' => 'text', 'config' => ['validation' => 'required|max:255|unique:taxonomies,slug,' . ($this->id ?? 'NULL') . ',id', 'placeholder' => 'e.g. electronics']],
      'description' => ['ui' => 'textarea', 'config' => ['validation' => 'nullable|max:255', 'placeholder' => 'e.g. Electronics category']],
      'content' => ['ui' => 'textarea', 'config' => ['validation' => 'nullable|max:255', 'placeholder' => 'e.g. Electronics category']],
      'image' => ['ui' => 'image', 'config' => ['validation' => 'nullable|image|max:2048', 'placeholder' => 'e.g. electronics.jpg']],
      'status' => ['ui' => 'button-radio', 'config' => ['options' => [['label' => 'Published', 'value' => 'published'], ['label' => 'Draft', 'value' => 'draft']], 'validation' => 'required|in:published,draft']],
      'parent' => ['ui' => 'select', 'config' => ['options' => [['label' => 'Published', 'value' => 'published'], ['label' => 'Draft', 'value' => 'draft']], 'validation' => 'required|in:published,draft']],
    ];
  }

  protected $fillable = [
    'name',
    'slug',
    'description',
    'content',
    'image',
    'status',
  ];

  public function categories()
  {
    return $this->belongsToMany(ProjectCategory::class, 'project_categories', 'project_id', 'category_id');
  }
}
