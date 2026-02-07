<?php

namespace PS0132E282\Core\Traits;

trait Filter
{
    protected function getFilter(string $key): array
    {
        return match($key) {
            'search' => [
                'key' => 'search',
                'label' => 'Tìm kiếm',
                'type' => 'text',
            ],
        };
    }
}
