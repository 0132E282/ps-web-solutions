<?php

namespace PS0132E282\Cms\Models;

use App\Models\User;
use PS0132E282\Cms\Models\Role;

class Admin extends User
{
    protected $table = 'users';

    public $statuses = [
        'active' => 'Active',
        'inactive' => 'Inactive',
    ];

    public function getMorphClass()
    {
        return User::class;
    }

    function configs()
    {
        return [
            'name' => ['type' => 'text', 'config' => ['primary' => true, 'validation' => 'required|max:255']],
            'email' => ['type' => 'email', 'config' => ['validation' => 'required|email|unique:users,email']],
            'password' => ['type' => 'password', 'config' => ['validation' => 'required|min:8']],
            'roles' => ['type' => 'multiple-selects', 'config' => ['collection' => 'settings.role', 'valueKey' => 'id', 'labelKey' => 'name', 'validation' => 'required|exists:roles,id']],
            'confirm_password' => ['type' => 'password', 'config' => ['validation' => 'required|min:8|confirmed']],
            'status' => ['type' => 'button-radio', 'config' => ['options' => $this->statuses, 'validation' => 'required|in:active,inactive']],
            'created_at' => ['type' => 'date', 'config' => ['validation' => 'required|date']],
        ];
    }

    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];
}
