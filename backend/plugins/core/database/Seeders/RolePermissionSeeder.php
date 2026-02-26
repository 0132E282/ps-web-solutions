<?php

namespace PS0132E282\Core\Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Route;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolePermissionSeeder extends Seeder
{
    private array $admins = [
        [
            'email' => 'admin@gmail.com',
            'password' => 'admin@gmail.com',
            'name' => 'Super Admin',
            'roles' => ['super-admin'],
        ],
        [
            'email' => 'subadmin@gmail.com',
            'password' => 'subadmin@gmail.com',
            'name' => 'Sub Admin',
            'roles' => ['admin'],
        ],
    ];

    public function run(): void
    {
        // 1. Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // 2. Generate permissions from 'admin.' routes
        $adminCount = $this->seedPermissionsFromRoutes('admin.', function ($routeName) {
            $permission = str_replace('admin.', '', $routeName);
            return [
                'name' => $permission,
                'group' => explode('.', $permission)[0] ?? '',
            ];
        });

        // 3. Generate permissions from 'api.' routes
        $apiCount = $this->seedPermissionsFromRoutes('api.', function ($routeName) {
            return [
                'name' => $routeName,
                'group' => 'api',
            ];
        });

        // 4. Create base roles and assign ALL permissions
        $allPermissions = Permission::pluck('name')->toArray();
        foreach (['admin', 'super-admin'] as $roleName) {
            $role = Role::firstOrCreate(['name' => $roleName]);
            $role->syncPermissions($allPermissions);
        }

        // 5. Create users from the $admins array and assign roles
        foreach ($this->admins as $adminData) {
            $user = User::firstOrCreate(
                ['email' => $adminData['email']],
                [
                    'name' => $adminData['name'],
                    'password' => $adminData['password'],
                    'email_verified_at' => now(),
                ]
            );

            // Assign defined roles to user
            $user->syncRoles($adminData['roles'] ?? []);
        }

        // 6. Output statistics
        $this->command->info('✅ Setup Roles & Permissions hoàn tất!');
        $this->command->info('📊 Admin Permissions: ' . $adminCount);
        $this->command->info('🔑 API Permissions: ' . $apiCount);
        $this->command->info('👥 Roles: admin, super-admin');

        $this->command->info('👤 Tài khoản đã tạo:');
        foreach ($this->admins as $admin) {
            $this->command->info('  - ' . $admin['email'] . ' (Mật khẩu: ' . $admin['password'] . ') - Roles: ' . implode(',', $admin['roles']));
        }
    }

    /**
     * Helper pattern to extract route names starting with a specific prefix
     * and create permissions with a callback mapping format.
     */
    protected function seedPermissionsFromRoutes(string $prefix, \Closure $formatCallback): int
    {
        $routes = Route::getRoutes();
        $routeNames = [];

        foreach ($routes as $route) {
            $name = $route->getName();
            if ($name && str_starts_with($name, $prefix)) {
                $routeNames[] = $name;
            }
        }

        $routeNames = array_unique($routeNames);
        sort($routeNames);

        $count = 0;
        foreach ($routeNames as $routeName) {
            $data = $formatCallback($routeName);
            Permission::firstOrCreate(
                ['name' => $data['name']],
                ['group' => $data['group']]
            );
            $count++;
        }

        return $count;
    }
}
