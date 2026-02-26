<?php

namespace App\Models\Content;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use PS0132E282\Core\Base\BaseTerm;

class ProjectCategory extends BaseTerm
{
  use HasFactory;

  public function configs(): array
  {
    return [
      'name' => ['ui' => 'text', 'config' => ['validation' => 'required|max:255', 'placeholder' => 'e.g. Electronics']],
      'slug' => ['ui' => 'text', 'config' => ['validation' => 'required|max:255|unique:taxonomies,slug,' . ($this->id ?? 'NULL') . ',id', 'placeholder' => 'e.g. electronics']],
      'description' => ['ui' => 'textarea', 'config' => ['validation' => 'nullable|max:255', 'placeholder' => 'e.g. Electronics category']],
      'image' => ['ui' => 'image', 'config' => ['validation' => 'nullable|image|max:2048', 'placeholder' => 'e.g. electronics.jpg']],
      'status' => ['ui' => 'button-radio', 'config' => ['options' => [['label' => 'Published', 'value' => 'published'], ['label' => 'Draft', 'value' => 'draft']], 'validation' => 'required|in:published,draft']],
      'parent' => ['ui' => 'select', 'config' => ['options' => [['label' => 'Published', 'value' => 'published'], ['label' => 'Draft', 'value' => 'draft']], 'validation' => 'required|in:published,draft']],
    ];
  }

  protected $fillable = [
    'name',
    'slug',
    'description',
    'image',
    'status',
  ];

  public function projects()
  {
    return $this->hasMany(Project::class);
  }
}
