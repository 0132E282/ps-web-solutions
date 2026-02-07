<?php

namespace PS0132E282\Core\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Route;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RolePermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Tạo permissions từ admin routes
        $adminRoutes = $this->getAdminRouteNames();
        $adminCount = 0;
        
        foreach ($adminRoutes as $routeName) {
            $permission = str_replace('admin.', '', $routeName);
            $group = explode('.', $permission)[0] ?? '';

            Permission::firstOrCreate([
                 'name'=> $permission,
                 'group' => $group,
            ]);
            $adminCount++;
        }

        $apiRoutes = $this->getApiRouteNames();
        $apiCount = 0;
        foreach ($apiRoutes as $routeName) {
            $permission = $routeName;
            Permission::firstOrCreate([
                 'name'=> $permission,
                 'group' => 'api',
            ]);
            $apiCount++;
        }

        foreach (['admin', 'super-admin'] as $role) {
            $role = Role::firstOrCreate(['name' => $role]);
            $role->syncPermissions(Permission::pluck('name')->toArray());
        }

        $this->command->info('✅ Permissions đã được tạo từ routes!');
        $this->command->info('📊 Tổng số Admin Permissions: '.$adminCount);
        $this->command->info('🔑 Tổng số API Permissions: '.$apiCount);
        $this->command->info('👥 Roles đã tạo: admin, super-admin');
    }

    /**
     * Lấy tất cả route names bắt đầu bằng "admin."
     *
     * @return array<string>
     */
    protected function getAdminRouteNames(): array
    {
        $routes = Route::getRoutes();
        $adminRouteNames = [];

        foreach ($routes as $route) {
            $routeName = $route->getName();
            if ($routeName && str_starts_with($routeName, 'admin.')) {
                $adminRouteNames[] = $routeName;
            }
        }

        $adminRouteNames = array_unique($adminRouteNames);
        sort($adminRouteNames);

        return $adminRouteNames;
    }

    /**
     * Lấy tất cả route names bắt đầu bằng "api."
     *
     * @return array<string>
     */
    protected function getApiRouteNames(): array
    {
        $routes = Route::getRoutes();
        $apiRouteNames = [];

        foreach ($routes as $route) {
            $routeName = $route->getName();
            if ($routeName && str_starts_with($routeName, 'api.')) {
                $apiRouteNames[] = $routeName;
            }
        }

        $apiRouteNames = array_unique($apiRouteNames);
        sort($apiRouteNames);

        return $apiRouteNames;
    }
}

