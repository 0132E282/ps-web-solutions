<?php

namespace App\Models;

use PS0132E282\Core\Base\BaseTerm;

class ThemeCategory extends BaseTerm
{
  public function configs(): array
  {
    return [
      'name' => ['ui' => 'text', 'config' => ['validation' => 'required|max:255', 'placeholder' => 'e.g. Electronics']],
      'slug' => ['ui' => 'text', 'config' => ['validation' => 'required|max:255|unique:categories,slug,' . ($this->id ?? 'NULL') . ',id', 'placeholder' => 'e.g. electronics']],
      'description' => ['ui' => 'textarea', 'config' => ['validation' => 'nullable|max:255', 'placeholder' => 'e.g. Electronics category']],
      'image' => ['ui' => 'image', 'config' => ['validation' => 'nullable|image|max:2048', 'placeholder' => 'e.g. electronics.jpg']],
      'status' => ['ui' => 'button-radio', 'config' => ['options' => [['label' => 'Published', 'value' => 'published'], ['label' => 'Draft', 'value' => 'draft']], 'validation' => 'required|in:published,draft']]
    ];
  }

  protected function getTaxonomyName(): string
  {
    return 'category';
  }

  protected $fillable = [
    'name',
    'slug',
    'description',
    'image',
    'status',
  ];
}
