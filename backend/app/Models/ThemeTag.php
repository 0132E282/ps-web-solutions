<?php

namespace App\Models;

use PS0132E282\Core\Base\BaseTerm;

class ThemeTag extends BaseTerm
{
  public function configs(): array
  {
    return [
      'name' => ['ui' => 'text', 'config' => ['validation' => 'required|max:255', 'placeholder' => 'e.g. Electronics']],
      'slug' => ['ui' => 'text', 'config' => ['validation' => 'required|max:255|unique:tags,slug,' . ($this->id ?? 'NULL') . ',id', 'placeholder' => 'e.g. electronics']],
      'status' => ['ui' => 'button-radio', 'config' => ['options' => [['label' => 'Published', 'value' => 'published'], ['label' => 'Draft', 'value' => 'draft']], 'validation' => 'required|in:published,draft']]
    ];
  }

  protected function getTaxonomyName(): string
  {
    return 'tag';
  }

  protected $fillable = [
    'name',
    'slug',
    'status',
  ];
}
