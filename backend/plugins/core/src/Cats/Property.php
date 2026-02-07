<?php

namespace PS0132E282\Core\Cats;

use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Log;

class Property implements CastsAttributes
{
    /**
     * Transform the attribute from the underlying model values.
     */
    public function get(Model $model, string $key, mixed $value, array $attributes): array
    {
        if (is_null($value) || $value === '') {
            return [];
        }

        // Nếu là array, trả về trực tiếp
        if (is_array($value)) {
            return $value;
        }

        // Nếu là string, decode JSON
        if (is_string($value)) {
            $decoded = json_decode($value, true);

            return is_array($decoded) ? $decoded : [];
        }

        return [];
    }

    /**
     * Transform the attribute to its underlying model values.
     */
    public function set(Model $model, string $key, mixed $value, array $attributes): ?string
    {
        Log::info('🔄 Property Cast SET triggered:', [
            'key' => $key,
            'value_type' => gettype($value),
            'value' => $value,
            'is_array' => is_array($value),
        ]);

        if (is_null($value) || (is_array($value) && empty($value))) {
            Log::info('🔄 Property Cast: Returning NULL');

            return null;
        }

        // Nếu là array, encode thành JSON
        if (is_array($value)) {
            $encoded = json_encode($value, JSON_UNESCAPED_UNICODE);
            Log::info('🔄 Property Cast: Encoding array to JSON:', ['encoded' => $encoded]);

            return $encoded;
        }

        // Nếu là string và là valid JSON, giữ nguyên
        if (is_string($value)) {
            // Validate JSON
            json_decode($value);
            if (json_last_error() === JSON_ERROR_NONE) {
                Log::info('🔄 Property Cast: Valid JSON string, keeping as-is');

                return $value;
            }
            // Nếu không phải JSON, encode nó
            $encoded = json_encode($value, JSON_UNESCAPED_UNICODE);
            Log::info('🔄 Property Cast: Non-JSON string, encoding:', ['encoded' => $encoded]);

            return $encoded;
        }

        Log::info('🔄 Property Cast: Unknown type, returning NULL');

        return null;
    }
}
