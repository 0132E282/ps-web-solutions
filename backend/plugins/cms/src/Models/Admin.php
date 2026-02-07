<?php

namespace PS0132E282\Cms\Models;

use App\Models\User;

class Admin extends User
{
    protected $table = 'users';

    public $configs = [
        'name' => ['type' => 'text', 'config' => ["primary" => true,'validation' => 'required|max:255']],
        'email' => ['type' => 'email', 'config' => [ 'validation' => 'required|email|unique:users,email']],
        'password' => ['type' => 'password', 'config' => ['validation' => 'required|min:8']],
        'roles' => ['type' => 'multiple-selects', 'config' => ['source' => ['route' => 'admin.roles.index', 'params' => ['fields' => ['id', 'name']], 'valueKey' => 'id', 'labelKey' => 'name']], 'validation' => 'required|exists:roles,id'],
        'confirm_password' => ['type' => 'password', 'config' => ['validation' => 'required|min:8|confirmed']],
        'status' => ['type' => 'button-radio', 'config' => ['options' => [['label' => 'Active', 'value' => 'active'], ['label' => 'Inactive', 'value' => 'inactive']], 'validation' => 'required|in:active,inactive']],
        'created_at' => ['type' => 'date', 'config' => ['validation' => 'required|date']],
    ];

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


