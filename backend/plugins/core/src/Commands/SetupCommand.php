<?php

namespace PS0132E282\Core\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

class SetupCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'essentials:setup
                            {--force : Overwrite existing files without confirmation}
                            {--merge : Merge with existing files when possible}
                            {--skip-npm : Skip frontend dependencies installation}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Setup core templates and install frontend dependencies (app.tsx, app.css, components.json, tailwind.config.ts, vite.config.ts, tsconfig.json)';

    /**
     * Template mappings: template file => target file
     *
     * @var array<string, string>
     */
    protected array $templates = [
        'app.tsx.template' => 'resources/js/app.tsx',
        'app.css.template' => 'resources/css/app.css',
        'components.json.template' => 'components.json',
        'tailwind.config.ts.template' => 'tailwind.config.ts',
        'vite.config.ts.template' => 'vite.config.ts',
        'tsconfig.json.template' => 'tsconfig.json',
    ];

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $templatesPath = base_path('plugins/core/resources/templates');

        if (! is_dir($templatesPath)) {
            $this->error("Templates directory not found: {$templatesPath}");

            return Command::FAILURE;
        }

        $this->info('Setting up core templates...');
        $this->newLine();

        [$successCount, $skippedCount] = $this->processTemplates($templatesPath);

        $this->newLine();
        $this->info("Setup complete! Created: {$successCount}, Skipped: {$skippedCount}");

        if (! $this->option('skip-npm')) {
            $this->newLine();
            $this->info('Installing frontend dependencies...');
            $this->installFrontendDependencies();
        }

        return Command::SUCCESS;
    }

    /**
     * Process all templates
     */
    protected function processTemplates(string $templatesPath): array
    {
        $successCount = 0;
        $skippedCount = 0;
        $force = $this->option('force');
        $merge = $this->option('merge');

        foreach ($this->templates as $template => $target) {
            $templatePath = "{$templatesPath}/{$template}";
            $targetPath = base_path($target);

            if (! file_exists($templatePath)) {
                $this->warn("Template not found: {$template}");

                continue;
            }

            if (file_exists($targetPath)) {
                if (! $force && ! $merge && ! $this->confirm("File <fg=yellow>{$target}</> already exists. Overwrite?", false)) {
                    $this->line("  <fg=yellow>⏭ Skipped</> {$target}");
                    $skippedCount++;

                    continue;
                }

                if ($merge && $this->canMerge($target)) {
                    $this->mergeFile($templatePath, $targetPath, $target);
                    $successCount++;

                    continue;
                }
            }

            File::ensureDirectoryExists(dirname($targetPath));
            File::copy($templatePath, $targetPath);
            $this->line("  <fg=green>✓ Created</> {$target}");
            $successCount++;
        }

        return [$successCount, $skippedCount];
    }

    /**
     * Install frontend dependencies (npm/pnpm)
     */
    protected function installFrontendDependencies(): void
    {
        $packageJsonPath = base_path('package.json');

        if (! file_exists($packageJsonPath)) {
            $this->warn('  ⚠ package.json not found, skipping frontend dependencies installation');

            return;
        }

        $this->mergePluginDependencies();

        $packageManager = $this->detectPackageManager();
        if (! $packageManager) {
            $this->warn('  ⚠ npm or pnpm not found, please install Node.js and npm/pnpm');

            return;
        }

        $this->line("  Using {$packageManager}...");

        $command = "{$packageManager} install";
        $returnCode = 0;
        exec('cd '.escapeshellarg(base_path())." && {$command} 2>&1", $output, $returnCode);

        if ($returnCode === 0) {
            $this->line('  <fg=green>✓ Frontend dependencies installed successfully</>');
        } else {
            $this->warn('  ⚠ Failed to install frontend dependencies');
            $this->line("  Run manually: <fg=yellow>{$command}</>");
        }
    }

    /**
     * Merge plugin dependencies into root package.json
     */
    protected function mergePluginDependencies(): void
    {
        $pluginPath = base_path('plugins/core/package.json');
        $rootPath = base_path('package.json');

        if (! file_exists($pluginPath)) {
            return;
        }

        $pluginJson = json_decode(file_get_contents($pluginPath), true);
        $rootJson = json_decode(file_get_contents($rootPath), true);

        if (! $pluginJson || ! $rootJson) {
            return;
        }

        $rootDeps = $rootJson['dependencies'] ?? [];
        $merged = false;

        // Merge dependencies and peerDependencies
        foreach (['dependencies', 'peerDependencies'] as $depType) {
            if (! isset($pluginJson[$depType]) || ! is_array($pluginJson[$depType])) {
                continue;
            }

            foreach ($pluginJson[$depType] as $package => $version) {
                if (! isset($rootDeps[$package]) || $rootDeps[$package] !== $version) {
                    $rootDeps[$package] = $version;
                    $merged = true;
                }
            }
        }

        if ($merged) {
            ksort($rootDeps);
            $rootJson['dependencies'] = $rootDeps;
            file_put_contents($rootPath, json_encode($rootJson, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)."\n");
            $this->line('  <fg=cyan>↻ Merged</> plugin dependencies into package.json');
        }
    }

    /**
     * Detect which package manager is available (pnpm or npm)
     */
    protected function detectPackageManager(): ?string
    {
        foreach (['pnpm', 'npm'] as $manager) {
            $check = shell_exec("which {$manager} 2>/dev/null");
            if ($check && trim($check)) {
                return $manager;
            }
        }

        return null;
    }

    /**
     * Check if file can be merged
     */
    protected function canMerge(string $target): bool
    {
        return in_array($target, [
            'vite.config.ts',
            'tsconfig.json',
        ]);
    }

    /**
     * Merge template content with existing file
     */
    protected function mergeFile(string $templatePath, string $targetPath, string $target): void
    {
        $templateContent = file_get_contents($templatePath);
        $existingContent = file_get_contents($targetPath);

        $merged = match ($target) {
            'vite.config.ts' => $this->mergeViteConfig($templateContent, $existingContent),
            'tsconfig.json' => $this->mergeTsConfig($templateContent, $existingContent),
            default => $templateContent,
        };

        File::put($targetPath, $merged);
        $this->line("  <fg=cyan>↻ Merged</> {$target}");
    }

    /**
     * Merge vite.config.ts files
     */
    protected function mergeViteConfig(string $templateContent, string $existingContent): string
    {
        preg_match('/resolve:\s*\{[^}]*alias:\s*\{([^}]+)\}/s', $templateContent, $templateAlias);
        preg_match('/resolve:\s*\{[^}]*alias:\s*\{([^}]+)\}/s', $existingContent, $existingAlias);

        if ($templateAlias && ! $existingAlias) {
            preg_match('/resolve:\s*\{([^}]+alias:[^}]+)\}/s', $templateContent, $resolveMatch);

            if ($resolveMatch) {
                $replacement = "resolve: {\n{$resolveMatch[1]}\n    }";
                $existingContent = preg_match('/resolve:\s*\{/', $existingContent)
                    ? preg_replace('/resolve:\s*\{[^}]*\}/s', $replacement, $existingContent)
                    : preg_replace('/(esbuild:)/', "{$replacement},\n    $1", $existingContent);
            }
        }

        if (! str_contains($existingContent, "import path from 'path';")) {
            $existingContent = preg_replace("/(import.*from.*['\"]vite['\"];)/", "$1\nimport path from 'path';", $existingContent);
        }

        return $existingContent;
    }

    /**
     * Merge tsconfig.json files
     */
    protected function mergeTsConfig(string $templateContent, string $existingContent): string
    {
        $templateJson = json_decode($templateContent, true);
        $existingJson = json_decode($existingContent, true);

        if (! $templateJson || ! $existingJson) {
            return $templateContent;
        }

        // Merge paths
        if (isset($templateJson['compilerOptions']['paths'])) {
            $existingJson['compilerOptions']['paths'] = array_merge(
                $existingJson['compilerOptions']['paths'] ?? [],
                $templateJson['compilerOptions']['paths']
            );
        }

        // Merge include
        if (isset($templateJson['include'])) {
            $existingJson['include'] = array_values(array_unique(array_merge(
                $existingJson['include'] ?? [],
                $templateJson['include']
            )));
        }

        // Merge other compiler options
        foreach ($templateJson['compilerOptions'] ?? [] as $key => $value) {
            if (! isset($existingJson['compilerOptions'][$key])) {
                $existingJson['compilerOptions'][$key] = $value;
            }
        }

        return json_encode($existingJson, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)."\n";
    }
}
