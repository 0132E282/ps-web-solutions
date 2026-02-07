<?php

namespace App\Models;

use PS0132E282\Core\Base\BaseModel;

class Theme extends BaseModel
{
  protected $table = 'themes';

  public function configs(): array
  {
    return [
      'images' => ['ui' => 'multiple-attachments', 'config' => ['validation' => 'nullable|array|max:10', 'placeholder' => 'e.g. product.jpg']],
      'name' => ['ui' => 'text', 'config' => ['validation' => 'required|max:255', 'placeholder' => 'e.g. Theme Name']],
      'slug' => ['ui' => 'text', 'config' => ['validation' => 'required|max:255|unique:themes,slug,' . ($this->id ?? 'NULL') . ',id', 'placeholder' => 'e.g. theme-name']],
      'content' => ['ui' => 'editor', 'config' => ['validation' => 'nullable|max:255', 'placeholder' => 'e.g. Theme description']],
      'price' => ['ui' => 'number', 'config' => ['validation' => 'required|numeric|min:0', 'placeholder' => 'e.g. 19.99']],
      'view_count' => ['ui' => 'number', 'config' => ['validation' => 'integer|min:0', 'placeholder' => 'e.g. 100']],
      'stock' => ['ui' => 'number', 'config' => ['validation' => 'required|integer|min:0', 'placeholder' => 'e.g. 100']],
      'image' => ['ui' => 'attachment', 'config' => ['validation' => 'nullable|array|max:10', 'placeholder' => 'e.g. product.jpg']],
      'compare_at_price' => ['ui' => 'number', 'config' => ['validation' => 'required|numeric|min:0', 'placeholder' => 'e.g. 19.99']],
      'link_download' => ['ui' => 'text', 'config' => ['validation' => 'nullable|max:255', 'placeholder' => 'e.g. https://example.com/download']],
      'status' => ['ui' => 'button-radio', 'config' => ['options' => [['label' => 'Published', 'value' => 'published'], ['label' => 'Draft', 'value' => 'draft']], 'validation' => 'required|in:published,draft']]
    ];
  }
  protected $fillable = [
    'name',
    'slug',
    'content',
    'price',
    'image',
    'status',
    'compare_at_price',
    'link_download',
    'images',
    'view_count',
    'image'
  ];

  public function category()
  {
    return $this->belongsTo(ThemeCategory::class, 'category_id');
  }
}
