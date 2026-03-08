<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use PS0132E282\Cms\Database\Seeders\RolePermissionSeeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            RolePermissionSeeder::class,
        ]);
    }
}
