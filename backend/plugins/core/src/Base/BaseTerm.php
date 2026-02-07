<?php

namespace PS0132E282\Core\Base;

use Aliziodev\LaravelTaxonomy\Models\Taxonomy;
use PS0132E282\Core\Cats\Localization;
use PS0132E282\Core\Cats\Property;
use PS0132E282\Core\Cats\SlugField;

abstract class BaseTerm extends Taxonomy
{
    protected $table = 'taxonomies';

    protected $appends = ['status'];

    /**
     * Boot the model.
     * Override Taxonomy::boot to handle localized slugs (array).
     */
    protected static function boot(): void
    {
        static::bootTraits();

        static::creating(function (self $term) {
            // Check uniqueness for array/string slug
            if (! empty($term->slug) && static::slugExists($term->slug, null)) {
                $slugStr = is_array($term->slug) ? json_encode($term->slug, JSON_UNESCAPED_UNICODE) : $term->slug;
                throw new \Exception("The slug '{$slugStr}' already exists.");
            }
        });

        static::updating(function (self $term) {
            if ($term->isDirty('slug') && ! empty($term->slug)) {
                if (static::slugExists($term->slug, $term->id)) {
                    $slugStr = is_array($term->slug) ? json_encode($term->slug, JSON_UNESCAPED_UNICODE) : $term->slug;
                    throw new \Exception("The slug '{$slugStr}' already exists.");
                }
            }
        });
    }

    /**
     * Check if a slug already exists.
     * Override to support localized slugs (array).
     *
     * @param  string|array  $slug
     */
    public static function slugExists($slug, ?int $excludeId = null): bool
    {
        if (is_array($slug)) {
            $query = static::query();

            $query->where(function ($q) use ($slug) {
                foreach ($slug as $locale => $value) {
                    if (! empty($value)) {
                        // Check if JSON column contains this locale value
                        // Using -> operator for JSON in MariaDB/MySQL
                        $q->orWhere("slug->{$locale}", $value);
                    }
                }
            });

            if ($excludeId) {
                $query->where('id', '!=', $excludeId);
            }

            return $query->exists();
        }

        return parent::slugExists($slug, $excludeId);
    }

    protected $fillable = [
        'name',
        'slug',
        'type',
        'parent_id',
        'property',
        'status',
        'sort_order',
        'lft',
        'rgt',
        'depth',

    ];

    /**
     * Get the casts array.
     * Merge parent casts with custom casts for localization support.
     */
    public function getCasts(): array
    {
        return array_merge(parent::getCasts(), [
            'property' => Property::class,
            'slug' => SlugField::class,
            'name' => Localization::class,
        ]);
    }

    /**
     * Get field configurations for the term form
     * Override this in child classes
     */
    abstract public function configs(): array;

    /**
     * Get the taxonomy name for this term type
     * Override this in child classes
     */
    abstract protected function getTaxonomyName(): string;

    /**
     * Get status attribute (published/draft)
     */
    public function getStatusAttribute()
    {
        return $this->deleted_at ? 'draft' : 'published';
    }

    /**
     * Set status attribute
     */
    public function setStatusAttribute($value)
    {
        // This will be handled by soft deletes
        if ($value === 'draft' && ! $this->deleted_at) {
            $this->delete(); // Soft delete
        } elseif ($value === 'published' && $this->deleted_at) {
            $this->restore();
        }
    }

    /**
     * Boot the model
     */
    protected static function booted(): void
    {
        static::addGlobalScope('taxonomy_type', function ($query) {
            $instance = new static;
            if (method_exists($instance, 'getTaxonomyName')) {
                $query->where('type', $instance->getTaxonomyName());
            }
        });

        static::creating(function ($term) {
            if (! $term->type && method_exists($term, 'getTaxonomyName')) {
                $term->type = $term->getTaxonomyName();
            }

            // Auto-generate slug if not provided
            if (! $term->slug && $term->name) {
                $nameValue = is_array($term->name)
                    ? ($term->name[config('app.locale')] ?? reset($term->name))
                    : $term->name;
                $term->slug = \Illuminate\Support\Str::slug($nameValue);
            }
        });
    }

    /**
     * Override to ensure type is set before save
     */
    public function save(array $options = [])
    {
        // Ensure type is set before saving
        if (! $this->type && method_exists($this, 'getTaxonomyName')) {
            $this->type = $this->getTaxonomyName();
        }

        return parent::save($options);
    }

    /**
     * Scope: Filter by this term's type
     */
    public function scopeByTaxonomy($query)
    {
        if (method_exists($this, 'getTaxonomyName')) {
            $taxonomyName = $this->getTaxonomyName();

            return $query->where('type', $taxonomyName);
        }

        return $query;
    }

    /**
     * Scope: Only active/published terms (not soft deleted)
     */
    public function scopeActive($query)
    {
        return $query->whereNull('deleted_at');
    }

    /**
     * Scope: Filter by status
     */
    public function scopeStatus($query, string $status)
    {
        if ($status === 'draft') {
            return $query->onlyTrashed();
        }

        return $query->whereNull('deleted_at');
    }

    /**
     * Get all models attached to this taxonomy term
     */
    public function attachedModels(string $modelClass)
    {
        return $this->morphedByMany(
            $modelClass,
            'taxonomable',
            'taxonomables',
            'taxonomy_id',
            'taxonomable_id'
        )->withTimestamps();
    }

    /**
     * Get property value by key
     *
     * @param  mixed  $default
     * @return mixed
     */
    public function getProperty(?string $key = null, $default = null)
    {
        $property = $this->property ?? [];

        if (is_null($key)) {
            return $property;
        }

        return data_get($property, $key, $default);
    }

    /**
     * Set property value by key
     *
     * @param  mixed  $value
     */
    public function setProperty(string $key, $value): void
    {
        $property = $this->property ?? [];
        data_set($property, $key, $value);
        $this->property = $property;
    }

    /**
     * Check if property key exists
     */
    public function hasProperty(string $key): bool
    {
        $property = $this->property ?? [];

        return data_get($property, $key) !== null;
    }

    /**
     * Get property type (for options)
     */
    public function getPropertyType(): ?string
    {
        return $this->getProperty('type');
    }

    /**
     * Get property values (for options)
     */
    public function getPropertyValues(): array
    {
        return $this->getProperty('values', []);
    }

    /**
     * Check if property is required
     */
    public function isPropertyRequired(): bool
    {
        return (bool) $this->getProperty('is_required', false);
    }
}
