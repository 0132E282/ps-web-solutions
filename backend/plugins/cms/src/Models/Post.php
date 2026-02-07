<?php

namespace PS0132E282\Cms\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use PS0132E282\Core\Base\BaseModel;
use PS0132E282\Core\Cats\FileMedia;
use PS0132E282\Core\Cats\Localization;
use PS0132E282\Core\Cats\SlugField;
use PS0132E282\Core\Traits\CanExport;
use PS0132E282\Core\Traits\CanImport;
use PS0132E282\Core\Traits\HasSeo;

class Post extends BaseModel
{
    use CanExport, CanImport, HasFactory, HasSeo;

    protected $table = 'posts';

    public function configs(): array
    {
        return [
            'title' => ['ui' => 'text', 'config' => ['validation' => 'required|max:255']],
            'content' => ['ui' => 'editor', 'config' => ['validation' => 'required']],
            'slug' => ['ui' => 'slug', 'config' => ['validation' => 'required|max:255']],
            'description' => ['ui' => 'textarea', 'config' => ['validation' => 'required|max:255']],
            'position' => ['ui' => 'text', 'config' => ['validation' => 'required|max:255']],
            'status' => ['ui' => 'button-radio', 'config' => ['layout' => 'horizontal', 'options' => [['label' => 'Published', 'value' => 'published'], ['label' => 'Draft', 'value' => 'draft'], ['label' => 'Archived', 'value' => 'archived']], 'validation' => 'required|in:published,draft,archived']],
            'image' => ['ui' => 'attachment', 'config' => ['validation' => 'required|exists:media,id']],
            'related_posts' => ['ui' => 'multiple-selects', 'config' => ['source' => ['route' => 'admin.posts.index', 'params' => ['fields' => ['id', 'title']], 'valueKey' => 'id', 'labelKey' => 'title']], 'validation' => 'required|exists:posts,id'],
            'categories' => ['ui' => 'multiple-selects', 'config' => ['source' => ['route' => 'admin.categories.index', 'params' => ['fields' => ['id', 'title']], 'valueKey' => 'id', 'labelKey' => 'title']], 'validation' => 'required|exists:taxonomies,id'],
            'published_at' => ['ui' => 'date', 'config' => ['validation' => 'required|date']],
            'attribute_data' => ['ui' => 'array', 'config' => ['validation' => 'required']],
            'seo' => $this->seo::configsSingleCondition(),
        ];
    }

    protected $fillable = [
        'title',
        'content',
        'description',
        'position',
        'status',
        'slug',
        'image',
        'published_at',
        'attribute_data',
    ];

    protected $casts = [
        'slug' => SlugField::class,
        'title' => Localization::class,
        'content' => Localization::class,
        'description' => Localization::class,
        'position' => Localization::class,
        'published_at' => Localization::class,
        'attribute_data' => Localization::class,
        'image' => FileMedia::class,
    ];

    public function related_posts(): BelongsToMany
    {
        return $this->belongsToMany(Post::class, 'post_ref_related_posts', 'post_id', 'related_post_id');
    }

    public function categories()
    {
        return $this->morphToMany(PostCategory::class, 'taxonomable', 'taxonomables', 'taxonomable_id', 'taxonomy_id');
    }

    // public function tags(): BelongsToMany
    // {
    //     return $this->belongsToMany(PostTag::class, 'post_ref_tags', 'post_id', 'tag_id');
    // }
}
