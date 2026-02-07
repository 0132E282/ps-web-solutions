<?php

namespace PS0132E282\Core\Services;

use Illuminate\Support\Collection;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

/**
 * Service để quản lý Roles và Permissions
 */
class PermissionService
{
    /**
     * Lấy tất cả roles
     */
    public function getAllRoles(): Collection
    {
        return Role::all();
    }

    /**
     * Lấy tất cả permissions
     */
    public function getAllPermissions(): Collection
    {
        return Permission::all();
    }

    /**
     * Lấy permissions theo nhóm/module
     * Pattern: admin.module.action -> group by "module" (phần thứ 2)
     */
    public function getPermissionsByModule(): array
    {
        $permissions = Permission::all();
        $grouped = [];

        foreach ($permissions as $permission) {
            $parts = explode('.', $permission->name);

            // Nếu pattern là admin.module.action thì lấy parts[1] làm module
            // Nếu không đủ 3 phần thì fallback về parts[0] hoặc 'other'
            $module = $parts[1] ?? $parts[0] ?? 'other';

            if (! isset($grouped[$module])) {
                $grouped[$module] = [];
            }

            $grouped[$module][] = $permission;
        }

        return $grouped;
    }

    /**
     * Tạo role mới
     */
    public function createRole(string $name, array $permissions = []): Role
    {
        $role = Role::create(['name' => $name]);

        if (! empty($permissions)) {
            $role->givePermissionTo($permissions);
        }

        return $role;
    }

    /**
     * Cập nhật permissions cho role
     */
    public function updateRolePermissions(Role $role, array $permissions): Role
    {
        $role->syncPermissions($permissions);

        return $role;
    }

    /**
     * Xóa role
     */
    public function deleteRole(Role $role): bool
    {
        return $role->delete();
    }

    /**
     * Gán role cho user
     */
    public function assignRoleToUser($user, string|array $roles): void
    {
        $user->assignRole($roles);
    }

    /**
     * Gỡ role khỏi user
     */
    public function removeRoleFromUser($user, string|array $roles): void
    {
        $user->removeRole($roles);
    }

    /**
     * Sync roles cho user (xóa tất cả roles cũ và gán roles mới)
     */
    public function syncUserRoles($user, array $roles): void
    {
        $user->syncRoles($roles);
    }

    /**
     * Gán permission trực tiếp cho user
     */
    public function givePermissionToUser($user, string|array $permissions): void
    {
        $user->givePermissionTo($permissions);
    }

    /**
     * Kiểm tra user có quyền không
     */
    public function userHasPermission($user, string $permission): bool
    {
        return $user->hasPermissionTo($permission);
    }

    /**
     * Kiểm tra user có role không
     */
    public function userHasRole($user, string|array $role): bool
    {
        return $user->hasRole($role);
    }

    /**
     * Làm mới cache permissions
     */
    public function refreshCache(): void
    {
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();
    }

    /**
     * Tạo permission nếu chưa tồn tại
     */
    public function createPermissionIfNotExists(string $name, string $group, ?string $description = null): Permission
    {
        return Permission::firstOrCreate(
            ['name' => $name],
            ['group' => $group, 'guard_name' => 'web', 'description' => $description]
        );
    }
}
