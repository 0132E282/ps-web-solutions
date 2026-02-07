<?php

namespace PS0132E282\Cms\Models;

use Illuminate\Database\Eloquent\Relations\MorphToMany;
use PS0132E282\Core\Base\BaseTerm;

class PostTag extends BaseTerm
{
    protected function getTaxonomyName(): string
    {
        return 'post_tag';
    }

    public function configs(): array
    {
        return [
            'name' => ['type' => 'text', 'config' => ['label' => 'Tag Name', 'validation' => 'required|max:255']],
            'slug' => ['type' => 'slug', 'config' => ['label' => 'Slug', 'validation' => 'required|max:255']],
            'description' => ['type' => 'textarea', 'config' => ['label' => 'Description', 'validation' => 'nullable|max:500']],
            'parent_id' => ['type' => 'select', 'config' => ['label' => 'Parent Tag', 'source' => ['route' => 'admin.post-tags.index', 'params' => ['fields' => ['id', 'name']], 'valueKey' => 'id', 'labelKey' => 'name'], 'validation' => 'nullable|exists:taxonomies,id']],
            'position' => ['type' => 'number', 'config' => ['label' => 'Position', 'validation' => 'integer|min:0']],
            'status' => ['type' => 'button-radio', 'config' => ['layout' => 'horizontal', 'label' => 'Status', 'options' => [['label' => 'Published', 'value' => 'published'], ['label' => 'Draft', 'value' => 'draft']], 'validation' => 'required|in:published,draft']],
        ];
    }

    public function posts(): MorphToMany
    {
        return $this->morphedByMany(Post::class, 'taggable', 'taggables', 'tag_id', 'taggable_id');
    }
}
