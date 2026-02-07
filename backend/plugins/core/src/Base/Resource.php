<?php

namespace PS0132E282\Core\Base;

use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\JsonResponse;
use Illuminate\Database\Eloquent\Model;

class Resource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return array
     */
    public function toArray($request): array
    {
        if ($this->resource instanceof Model) {
            return $this->resource->toArray();
        }
        
        if (is_array($this->resource)) {
            return $this->resource;
        }
        
        return [
            'id' => $this->id ?? null,
            'created_at' => $this->created_at ?? null,
            'updated_at' => $this->updated_at ?? null,
        ];
    }

    /**
     * Create a success response with item.
     *
     * @param  mixed  $resource
     * @param  array  $additional
     * @return JsonResponse
     */
    public static function item($resource, array $additional = []): JsonResponse
    {
        return response()->json(array_merge([
            'type' => 'success',
            'item' => (new static($resource))->toArray(request()),
        ], $additional));
    }

    /**
     * Create a success response with items (collection).
     *
     * @param  mixed  $resource
     * @param  array  $additional
     * @return JsonResponse
     */
    public static function items($resource, array $additional = []): JsonResponse
    {
        $isPaginated = $resource instanceof LengthAwarePaginator;
        $collection = $isPaginated ? $resource->getCollection() : $resource;

        $items = collect($collection)->map(function ($item) {
            if (!is_array($item) && !is_object($item)) {
                return $item;
            }
            return (new static($item))->toArray(request());
        })->toArray();

        $data = [
            'type' => 'success',
            'items' => $items,
        ];

        if ($isPaginated) {
            $data = array_merge($data, self::extractPagination($resource));
        }

        return response()->json(array_merge($data, $additional));
    }
    
    public static function extractPagination(LengthAwarePaginator $paginator): array
    {
        // Directly access paginator data without calling toArray()
        return [
            'current_page' => $paginator->currentPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
            'last_page' => $paginator->lastPage(),
            'from' => $paginator->firstItem(),
            'to' => $paginator->lastItem(),
            'first_page_url' => $paginator->url(1),
            'last_page_url' => $paginator->url($paginator->lastPage()),
            'next_page_url' => $paginator->nextPageUrl(),
            'prev_page_url' => $paginator->previousPageUrl(),
            'path' => $paginator->path(),
            'links' => [],
        ];
    }

    /**
     * Create an error response.
     *
     * @param  string  $message
     * @param  array  $additional
     * @param  int  $status
     * @return JsonResponse
     */
    public static function error(string $message, array $additional = [], int $status = 400): JsonResponse
    {
        return response()->json(array_merge([
            'type' => 'error',
            'message' => $message,
        ], $additional), $status);
    }
}
