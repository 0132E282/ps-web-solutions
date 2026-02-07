<?php

namespace PS0132E282\Cms\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\File;
use Inertia\Inertia;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class SettingController extends Controller
{
    public function index(string $key)
    {
        // Load settings data from database
        $settingData = $this->loadSettingData($key);
        
        $configData = $this->getViewFromConfig($key);
        if ($configData !== null) {
            return $this->renderView(
                $configData['view'],
                array_merge(['key' => $key, $key => $settingData], $configData['data'] ?? [])
            );
        }

        $mainPagePath = resource_path("js/pages/settings/{$key}.tsx");
        if (File::exists($mainPagePath)) {
            return $this->renderView("settings/{$key}", ['key' => $key, $key => $settingData]);
        }

        $pluginView = $this->findInPlugins($key);
        if ($pluginView !== null) {
            return $this->renderView($pluginView, ['key' => $key, $key => $settingData]);
        }
        throw new NotFoundHttpException("Settings page '{$key}' not found.");
    }

    /**
     * Render Inertia view với data
     *
     * @param string $view
     * @param array $data
     * @return \Inertia\Response
     */
    protected function renderView(string $view, array $data = []): \Inertia\Response
    {
        return Inertia::render($view, $data);
    }

    /**
     * Lấy view và data từ config plugins.php
     *
     * @param string $key
     * @return array{view: string, data?: array}|null
     */
    protected function getViewFromConfig(string $key): ?array
    {
        $plugins = config('plugins', []);

        foreach ($plugins as $plugin) {
            if (!isset($plugin['enabled']) || !$plugin['enabled']) {
                continue;
            }

            if (!isset($plugin['settings']) || !is_array($plugin['settings'])) {
                continue;
            }

            // Hỗ trợ nhiều format config
            foreach ($plugin['settings'] as $setting) {
                // Format 1: $setting[$key]['view'] hoặc $setting[$key]['views']
                if (isset($setting[$key])) {
                    $settingConfig = $setting[$key];
                    $view = $settingConfig['view'] ?? $settingConfig['views'] ?? null;

                    if ($view) {
                        return [
                            'view' => $view,
                            'data' => $settingConfig['data'] ?? null,
                        ];
                    }
                }

                // Format 2: $setting['key'] === $key
                if (isset($setting['key']) && $setting['key'] === $key) {
                    $view = $setting['view'] ?? $setting['views'] ?? null;

                    if ($view) {
                        return [
                            'view' => $view,
                            'data' => $setting['data'] ?? null,
                        ];
                    }
                }
            }
        }

        return null;
    }

    /**
     * Tìm settings page trong tất cả plugins
     *
     * @param string $key
     * @return string|null
     */
    protected function findInPlugins(string $key): ?string
    {
        $plugins = config('plugins', []);

        // Sắp xếp plugins: enabled trước, sau đó theo thứ tự trong config
        $enabledPlugins = array_filter($plugins, fn($plugin) => $plugin['enabled'] ?? true);
        $disabledPlugins = array_filter($plugins, fn($plugin) => !($plugin['enabled'] ?? true));
        $sortedPlugins = array_merge($enabledPlugins, $disabledPlugins);

        foreach ($sortedPlugins as $plugin) {
            if (!isset($plugin['enabled']) || !$plugin['enabled']) {
                continue;
            }

            $pluginName = $plugin['name'] ?? null;
            if (!$pluginName) {
                continue;
            }

            $pluginPagePath = base_path("plugins/{$pluginName}/resources/js/pages/settings/{$key}.tsx");

            if (File::exists($pluginPagePath)) {
                return "{$pluginName}/settings/{$key}";
            }
        }

        return null;
    }

    /**
     * Load settings data from database
     *
     * @param string $key
     * @return array|null
     */
    protected function loadSettingData(string $key): ?array
    {
        $setting = \PS0132E282\Cms\Models\Setting::where('key', $key)->first();
        
        if ($setting && $setting->value) {
            $decoded = json_decode($setting->value, true);
            return is_array($decoded) ? $decoded : null;
        }
        
        return null;
    }

    /**
     * Save settings data
     *
     * @param string $key
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function save(string $key, \Illuminate\Http\Request $request)
    {
        $data = $request->except(['_token', '_method']);
        
        // Store settings in database
        $setting = \PS0132E282\Cms\Models\Setting::firstOrCreate(['key' => $key]);
        $setting->value = json_encode($data);
        $setting->save();

        return redirect()->back()->with('success', 'Cài đặt đã được lưu thành công!');
    }
}
