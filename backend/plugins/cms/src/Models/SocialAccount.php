<?php

namespace PS0132E282\Cms\Models;

use Illuminate\Database\Eloquent\Model;

class SocialAccount extends Model
{
    protected $fillable = [
        'account_id',
        'provider_id',
        'provider',
        'email',
        'avatar',
        'type',
    ];

    public function user()
    {
        return $this->belongsTo(\App\Models\User::class, 'account_id');
    }
}
