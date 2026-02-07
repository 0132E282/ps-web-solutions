<?php

namespace PS0132E282\Cms\Models;

use PS0132E282\Core\Base\BaseTerm;
use PS0132E282\Core\Traits\HasSeo;

class PostCategory extends BaseTerm
{
    use HasSeo;

    protected function getTaxonomyName(): string
    {
        return 'post_category';
    }

    public function configs(): array
    {
        return [
            'name' => ['type' => 'text', 'config' => ['label' => 'Category Name', 'validation' => 'required|max:255']],
            'slug' => ['type' => 'slug', 'config' => ['label' => 'Slug', 'validation' => 'required|max:255']],
            'description' => ['type' => 'textarea', 'config' => ['label' => 'Description', 'validation' => 'nullable|max:500']],
            'parent_id' => ['type' => 'select', 'config' => ['label' => 'Parent Category', 'source' => ['route' => 'admin.post-categories.index', 'params' => ['fields' => ['id', 'name']], 'valueKey' => 'id', 'labelKey' => 'name'], 'validation' => 'nullable|exists:taxonomies,id']],
            'position' => ['type' => 'number', 'config' => ['label' => 'Position', 'validation' => 'integer|min:0']],
            'status' => ['type' => 'button-radio', 'config' => ['label' => 'Status', 'options' => [['label' => 'Published', 'value' => 'published'], ['label' => 'Draft', 'value' => 'draft']], 'validation' => 'required|in:published,draft']],
            'seo' => $this->seo::configsSingleCondition(),
        ];
    }

    public function posts()
    {
        return $this->attachedModels(Post::class);
    }

    public function getUrlFrontendAttribute(): string
    {
        return config('app.url').'/'.$this->slug;
    }
}
