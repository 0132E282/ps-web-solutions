<?php

namespace PS0132E282\Core\Traits;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo; 
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\Relations\MorphOne;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\UploadedFile;
use PS0132E282\Core\Models\Media;

trait Relationships
{
    protected function extractRelationships(&$data): array
    {
        $relationships = [];
        $modelInstance = null;
        if (isset($this->model) && class_exists($this->model)) {
            $modelInstance = new $this->model;
        }
        
        if (!$modelInstance) {
            return [
                'relationships' => $relationships,
                'data' => $data,
            ];
        }
        
        foreach ($data as $key => $value) {
            // Skip if key is a fillable column (not a relationship)
            $fillable = $modelInstance->getFillable();
            if (in_array($key, $fillable)) {
                continue; // This is a fillable column, keep it in data
            }
            
            // Skip if key is a JSON cast column
            $casts = $modelInstance->getCasts();
            if (isset($casts[$key])) {
                continue; // This is a casted column, keep it in data
            }
            
            if ($this->isRelationship($key, $modelInstance)) {
                $relationships[$key] = $value;
                unset($data[$key]);
            }
        }
        
        return [
            'relationships' => $relationships,
            'data' => $data,
        ];
    }

    /**
     * Sync relationships for a model instance
     * 
     * @param Model $item
     * @param array $relationships
     * @return void
     */
    protected function syncRelationships(Model $item, array $relationships): void
    {
        if (empty($relationships)) {
            return;
        }
        foreach ($relationships as $relationName => $relationValue) {
            if (!method_exists($item, $relationName)) {
                continue;
            }
            
            try {
                $relation = $item->$relationName();
                if ($relation instanceof BelongsToMany) {
                    if (is_array($relationValue) && !empty($relationValue)) {
                        $processedValue = $this->processFilesInRelationValue($relationValue);
                        $relation->sync($processedValue);
                    } else {
                        $relation->sync([]);
                    }
                } elseif ($relation instanceof BelongsTo) {
                    $foreignKey = $relation->getForeignKeyName();
                    if ($relationValue !== null && $relationValue !== '') {
                        $item->$foreignKey = $relationValue;
                        $item->save();
                    }
                } elseif ($relation instanceof HasMany || $relation instanceof HasOne) {
                    if (is_array($relationValue) && !empty($relationValue)) {
                        $processedValue = $this->processFilesInRelationValue($relationValue);
                        $relation->sync($processedValue);
                    }
                } elseif ($relation instanceof MorphMany || $relation instanceof MorphOne) {
                    if (is_array($relationValue) && !empty($relationValue)) {
                        $processedValue = $this->processFilesInRelationValue($relationValue);
                        if ($relation instanceof MorphOne) {
                            $existing = $relation->first();
                            if ($existing) {
                                Model::withoutEvents(function () use ($existing, $processedValue) {
                                    $existing->update($processedValue);
                                });
                            } else {
                                $relationInstance = $relation;
                                Model::withoutEvents(function () use ($relationInstance, $processedValue) {
                                    $relationInstance->create($processedValue);
                                });
                            }
                        } else {
                            // MorphMany: create new records
                            $relationInstance = $relation;
                            Model::withoutEvents(function () use ($relationInstance, $processedValue) {
                                $relationInstance->create($processedValue);
                            });
                        }
                    }
                }
            } catch (\Exception $e) {
                // Log error nhưng không throw để không làm gián đoạn flow
                Log::warning("Failed to sync relationship {$relationName}: " . $e->getMessage());
            }
        }
    }

    /**
     * Xử lý UploadedFile trong relationValue - upload file và chuyển thành Media data
     * 
     * @param array $relationValue
     * @return array
     */
    protected function processFilesInRelationValue(array $relationValue): array
    {
        $processed = [];
        
        foreach ($relationValue as $key => $value) {
            if ($value instanceof UploadedFile) {
                // Upload file và tạo Media record
                $media = Media::uploadFile($value);
                if ($media) {
                    // Chuyển Media thành format array để lưu vào database
                    $processed[$key] = $media->toArray();   
                }
            } else {
                $processed[$key] = $value;
            }
        }

        return $processed;
    }
}

