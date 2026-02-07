<?php

namespace PS0132E282\Cms\Models;

use PS0132E282\Core\Base\BaseModel;

class Redirect extends BaseModel
{
    protected $table = 'redirects';

    public function configs(): array
    {
        return [
            'old_url' => [
                'ui' => 'text',
                'config' => [
                    'validation' => 'required|max:255|unique:redirects,old_url,'.($this->id ?? 'NULL').',id',
                    'placeholder' => 'e.g. /old-page',
                ],
            ],
            'new_url' => [
                'ui' => 'text',
                'config' => [
                    'validation' => 'required|max:255',
                    'placeholder' => 'e.g. /new-page or https://example.com',
                ],
            ],
            'status_code' => [
                'ui' => 'select',
                'config' => [
                    'options' => [
                        ['label' => '301 - Permanent', 'value' => 301],
                        ['label' => '302 - Temporary', 'value' => 302],
                    ],
                    'validation' => 'required|in:301,302',
                ],
            ],
            'status' => [
                'ui' => 'button-radio',
                'config' => [
                    'options' => [
                        ['label' => 'Published', 'value' => 'published'],
                        ['label' => 'Draft', 'value' => 'draft'],
                    ],
                    'validation' => 'required|in:published,draft',
                ],
            ],
        ];
    }

    protected $fillable = [
        'old_url',
        'new_url',
        'status_code',
        'status',
    ];

    protected $casts = [
        'status_code' => 'integer',
        'status' => 'boolean',
    ];
}
