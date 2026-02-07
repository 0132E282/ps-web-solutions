<?php

namespace PS0132E282\Core\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

class MakeModuleCommand extends Command
{
    protected $signature = 'essentials:module {name}
                            {--path= : Custom path for the module files}
                            {--plugin= : Create files in a plugin (e.g., --plugin=core)}
                            {--skip= : Comma-separated list of files to skip (migration,model,controller)}';

    protected $description = 'Create a new module with migration, model, and controller';

    public function handle(): int
    {
        $name = $this->argument('name');
        $plugin = $this->option('plugin');
        $path = $this->option('path');
        $skip = array_map('trim', explode(',', $this->option('skip') ?? ''));

        // Nếu có --plugin, override path
        if ($plugin) {
            $pluginPath = base_path("plugins/{$plugin}");
            if (! is_dir($pluginPath)) {
                $this->error("Plugin '{$plugin}' not found at: {$pluginPath}");

                return Command::FAILURE;
            }
            $path = "plugins/{$plugin}";
        } else {
            $path = $path ?? 'app';
        }

        $this->info("Creating module: {$name}");
        $this->newLine();

        $created = 0;
        $skipped = 0;

        // Create Migration
        if (! in_array('migration', $skip)) {
            if ($this->createMigration($name, $plugin)) {
                $created++;
            } else {
                $skipped++;
            }
        } else {
            $this->line('  <fg=yellow>⏭ Skipped</> migration (--skip=migration)');
            $skipped++;
        }

        // Create Model
        if (! in_array('model', $skip)) {
            if ($this->createModel($name, $path)) {
                $created++;
            } else {
                $skipped++;
            }
        } else {
            $this->line('  <fg=yellow>⏭ Skipped</> model (--skip=model)');
            $skipped++;
        }

        // Create Controller
        if (! in_array('controller', $skip)) {
            if ($this->createController($name, $path)) {
                $created++;
            } else {
                $skipped++;
            }
        } else {
            $this->line('  <fg=yellow>⏭ Skipped</> controller (--skip=controller)');
            $skipped++;
        }

        $this->newLine();
        $this->info("Module created! Files: {$created}, Skipped: {$skipped}");

        return Command::SUCCESS;
    }

    protected function createMigration(string $name, ?string $plugin = null): bool
    {
        $tableName = Str::plural(Str::snake($name));
        $className = 'Create'.Str::plural(Str::studly($name)).'Table';
        $fileName = date('Y_m_d_His').'_create_'.$tableName.'_table.php';

        if ($plugin) {
            $migrationsDir = base_path("plugins/{$plugin}/database/migrations");
            $filePath = "{$migrationsDir}/{$fileName}";
        } else {
            $migrationsDir = database_path('migrations');
            $filePath = "{$migrationsDir}/{$fileName}";
        }

        if (file_exists($filePath)) {
            if (! $this->confirm("Migration {$fileName} already exists. Overwrite?", false)) {
                return false;
            }
        }

        // Đảm bảo thư mục migrations tồn tại
        if (! is_dir($migrationsDir)) {
            File::makeDirectory($migrationsDir, 0755, true);
        }

        $stub = $this->getMigrationStub($className, $tableName);
        File::put($filePath, $stub);

        $this->line("  <fg=green>✓ Created</> migration: {$fileName}");

        return true;
    }

    protected function createModel(string $name, string $path): bool
    {
        $className = Str::studly($name);
        $plugin = $this->option('plugin');
        $namespace = $this->getNamespace($path, $plugin, 'model');

        if ($plugin) {
            $filePath = base_path("plugins/{$plugin}/src/Models/{$className}.php");
        } else {
            $filePath = $this->getFilePath($path, "Models/{$className}.php");
        }

        if (file_exists($filePath)) {
            if (! $this->confirm("Model {$className} already exists. Overwrite?", false)) {
                return false;
            }
        }

        $tableName = Str::plural(Str::snake($name));
        $stub = $this->getModelStub($className, $namespace, $tableName);

        $dir = dirname($filePath);
        if (! is_dir($dir)) {
            File::makeDirectory($dir, 0755, true);
        }

        File::put($filePath, $stub);

        $this->line("  <fg=green>✓ Created</> model: {$className}");

        return true;
    }

    protected function createController(string $name, string $path): bool
    {
        $className = Str::studly($name).'Controller';
        $plugin = $this->option('plugin');
        $namespace = $this->getNamespace($path, $plugin);
        $modelClass = $this->getModelClass($path, $name, $plugin);

        if ($plugin) {
            $filePath = base_path("plugins/{$plugin}/src/Controllers/{$className}.php");
        } else {
            $filePath = $this->getFilePath($path, "Http/Controllers/{$className}.php");
        }

        if (file_exists($filePath)) {
            if (! $this->confirm("Controller {$className} already exists. Overwrite?", false)) {
                return false;
            }
        }

        $stub = $this->getControllerStub($className, $namespace, $modelClass, $name);

        $dir = dirname($filePath);
        if (! is_dir($dir)) {
            File::makeDirectory($dir, 0755, true);
        }

        File::put($filePath, $stub);

        $this->line("  <fg=green>✓ Created</> controller: {$className}");

        return true;
    }

    protected function getMigrationStub(string $className, string $tableName): string
    {
        return <<<PHP
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('{$tableName}', function (Blueprint \$table) {
            \$table->id();
            \$table->string('name');
            \$table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('{$tableName}');
    }
};
PHP;
    }

    protected function getModelStub(string $className, string $namespace, string $tableName): string
    {
        return <<<PHP
<?php

namespace {$namespace};

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class {$className} extends Model
{
    use HasFactory;

    protected \$table = '{$tableName}';

    protected \$fillable = [
        'name',
    ];

    protected \$casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
}
PHP;
    }

    protected function getControllerStub(string $className, string $namespace, string $modelClass, string $name): string
    {
        $pagePath = Str::kebab($name);
        $modelName = class_basename($modelClass);
        $plugin = $this->option('plugin');

        // Nếu tạo trong plugin, namespace là Controllers, không phải Http\Controllers
        if ($plugin) {
            $controllerNamespace = "{$namespace}\\Controllers";
        } else {
            $controllerNamespace = "{$namespace}\\Http\\Controllers";
        }

        return <<<PHP
<?php

namespace {$controllerNamespace};

use PS0132E282\Core\Base\CmsController;
use {$modelClass};

class {$className} extends CmsController
{
    protected \$model = {$modelName}::class;

    protected function getPage(string \$action): string
    {
        return '{$pagePath}/' . \$action;
    }
}
PHP;
    }

    protected function getNamespace(string $path, ?string $plugin = null, ?string $type = null): string
    {
        if ($plugin) {
            $pluginName = Str::studly($plugin);
            $baseNamespace = "PS0132E282\\{$pluginName}";

            // Nếu là model, thêm Models vào namespace
            if ($type === 'model') {
                return "{$baseNamespace}\\Models";
            }

            return $baseNamespace;
        }

        if ($path === 'app' || str_starts_with($path, 'app/')) {
            return 'App';
        }

        // Convert path to namespace
        $path = str_replace(['/', '\\'], '/', $path);
        $parts = explode('/', trim($path, '/'));
        $namespace = 'App';

        foreach ($parts as $part) {
            if (! empty($part) && $part !== 'app') {
                $namespace .= '\\'.Str::studly($part);
            }
        }

        return $namespace;
    }

    protected function getFilePath(string $path, string $file): string
    {
        if ($path === 'app') {
            return base_path("app/{$file}");
        }

        return base_path("{$path}/{$file}");
    }

    protected function getModelClass(string $path, string $name, ?string $plugin = null): string
    {
        $namespace = $this->getNamespace($path, $plugin, 'model');
        $className = Str::studly($name);

        return "{$namespace}\\{$className}";
    }
}
