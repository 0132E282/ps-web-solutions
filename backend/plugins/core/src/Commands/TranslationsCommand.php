<?php

namespace PS0132E282\Core\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

class TranslationsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'essentials:translations 
                            {--plugin=core : Plugin name}
                            {--locale= : Locale to generate (en, vi, etc.) - leave empty for all}
                            {--namespace= : Namespace name (common, cms, etc.)}
                            {--merge : Merge with existing translations}
                            {--format=json : Output format: json or php}
                            {--output-dir= : Output directory (default: lang directory)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate merged translations file from all language files';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $pluginName = $this->option('plugin');
        $locale = $this->option('locale');
        $namespace = $this->option('namespace');
        $merge = $this->option('merge');
        $format = $this->option('format');
        $outputDir = $this->option('output-dir');

        $langDir = base_path("plugins/{$pluginName}/lang");

        if (!is_dir($langDir)) {
            $this->error("Language directory not found: {$langDir}");
            return Command::FAILURE;
        }

        $this->info("Generating translations for plugin: {$pluginName}");

        // Get all locales or specific locale
        $locales = $locale ? [$locale] : array_filter(
            array_map('basename', glob($langDir . '/*', GLOB_ONLYDIR)),
            fn($dir) => is_dir($langDir . '/' . $dir)
        );

        if (empty($locales)) {
            $this->error("No locales found in {$langDir}");
            return Command::FAILURE;
        }

        $merged = [];

        foreach ($locales as $currentLocale) {
            $localePath = $langDir . '/' . $currentLocale;
            $this->line("Processing locale: <fg=cyan>{$currentLocale}</>");

            // Get all PHP files or specific namespace
            $files = $namespace 
                ? [$localePath . '/' . $namespace . '.php']
                : glob($localePath . '/*.php');

            $localeData = [];

            foreach ($files as $file) {
                if (!file_exists($file)) {
                    continue;
                }

                $fileNamespace = basename($file, '.php');
                $this->line("  - Loading: <fg=green>{$fileNamespace}.php</>");

                try {
                    $data = require $file;
                    if (is_array($data)) {
                        if ($merge && isset($localeData[$fileNamespace])) {
                            $localeData[$fileNamespace] = array_merge_recursive(
                                $localeData[$fileNamespace],
                                $data
                            );
                        } else {
                            $localeData[$fileNamespace] = $data;
                        }
                    }
                } catch (\Exception $e) {
                    $this->warn("  ⚠ Failed to load {$fileNamespace}.php: " . $e->getMessage());
                }
            }

            if (!empty($localeData)) {
                $merged[$currentLocale] = $localeData;
            }
        }

        if (empty($merged)) {
            $this->warn('No translations found!');
            return Command::FAILURE;
        }

        // Display summary
        $this->newLine();
        $this->info('Generated translations summary:');
        foreach ($merged as $currentLocale => $namespaces) {
            $count = count($namespaces);
            $this->line("  <fg=cyan>{$currentLocale}</>: {$count} namespace(s) - " . implode(', ', array_keys($namespaces)));
        }

        // Determine output directory
        if ($outputDir) {
            $outputDirectory = $outputDir;
        } else {
            // Default to public directory
            $outputDirectory = public_path('lang');
        }

        if (!is_dir($outputDirectory)) {
            File::makeDirectory($outputDirectory, 0755, true);
        }

        // Generate output files
        if ($format === 'json') {
            $this->saveAsJson($merged, $outputDirectory);
        } else {
            $this->saveAsPhp($merged, $outputDirectory);
        }

        $this->newLine();
        $this->info('<fg=green>✓ Translations generated successfully!</>');

        return Command::SUCCESS;
    }

    /**
     * Save merged translations as JSON files (one per locale)
     */
    protected function saveAsJson(array $merged, string $outputDir): void
    {
        foreach ($merged as $locale => $namespaces) {
            $filePath = $outputDir . '/' . $locale . '.json';
            
            $json = json_encode($namespaces, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            
            File::put($filePath, $json);
            $this->info("Saved: <fg=green>{$filePath}</>");
        }
    }

    /**
     * Save merged translations as PHP file
     */
    protected function saveAsPhp(array $merged, string $outputDir): void
    {
        $outputPath = $outputDir . '/translations.php';

        $content = "<?php\n\n";
        $content .= "/**\n";
        $content .= " * Auto-generated merged translations file\n";
        $content .= " * Generated at: " . date('Y-m-d H:i:s') . "\n";
        $content .= " * DO NOT EDIT THIS FILE MANUALLY\n";
        $content .= " */\n\n";
        $content .= "return [\n";
        $content .= $this->arrayToPhpString($merged, 1);
        $content .= "];\n";

        File::put($outputPath, $content);
        $this->info("Saved to: <fg=green>{$outputPath}</>");
    }

    /**
     * Convert array to PHP string representation with proper formatting
     */
    protected function arrayToPhpString(array $array, int $indent = 0): string
    {
        $spaces = str_repeat('    ', $indent);
        $output = '';

        foreach ($array as $key => $value) {
            $keyStr = $this->formatKey($key);

            if (is_array($value)) {
                $output .= "{$spaces}{$keyStr} => [\n";
                $output .= $this->arrayToPhpString($value, $indent + 1);
                $output .= "{$spaces}],\n";
            } else {
                $valueStr = $this->formatValue($value);
                $output .= "{$spaces}{$keyStr} => {$valueStr},\n";
            }
        }

        return $output;
    }

    /**
     * Format array key for PHP output
     */
    protected function formatKey($key): string
    {
        if (is_string($key)) {
            // Escape single quotes and wrap in quotes
            $escaped = str_replace("'", "\\'", $key);
            return "'{$escaped}'";
        }
        return (string) $key;
    }

    /**
     * Format value for PHP output
     */
    protected function formatValue($value): string
    {
        if (is_string($value)) {
            // Escape single quotes and wrap in quotes
            $escaped = str_replace("'", "\\'", $value);
            return "'{$escaped}'";
        }
        if (is_bool($value)) {
            return $value ? 'true' : 'false';
        }
        if (is_null($value)) {
            return 'null';
        }
        return var_export($value, true);
    }
}

