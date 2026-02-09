<?php

namespace App\Models\Theme;

use PS0132E282\Core\Base\BaseTerm;

class ThemeOption extends BaseTerm
{
  public function configs(): array
  {
    return [
      'name' => ['ui' => 'text', 'config' => ['validation' => 'required|max:255', 'placeholder' => 'e.g. Option name']],
      'slug' => ['ui' => 'text', 'config' => ['validation' => 'required|max:255|unique:taxonomies,slug,' . ($this->id ?? 'NULL') . ',id', 'placeholder' => 'e.g. option-name']],
      'description' => ['ui' => 'textarea', 'config' => ['validation' => 'nullable|max:255', 'placeholder' => 'e.g. Option description']],
      'image' => ['ui' => 'image', 'config' => ['validation' => 'nullable|image|max:2048', 'placeholder' => 'e.g. option.jpg']],
      'status' => ['ui' => 'button-radio', 'config' => ['options' => [['label' => 'Published', 'value' => 'published'], ['label' => 'Draft', 'value' => 'draft']], 'validation' => 'required|in:published,draft']],
      'parent' => ['ui' => 'select', 'config' => ['collection' => 'theme-option', 'validation' => 'nullable|exists:taxonomies,id']],
    ];
  }

  protected $fillable = [
    'name',
    'slug',
    'description',
    'image',
    'status',
  ];
}
