<?php

namespace PS0132E282\Core\Traits;

use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use PS0132E282\Core\Base\Resource;
use PS0132E282\Core\Base\BaseController;

/**
 * Trait for handling response-related methods.
 */
trait HasResponse
{
    /**
     * Render an Inertia page with views + configs merged automatically.
     */
    protected function renderInertia(string $action, array $extra = [], ?string $flash = null): \Inertia\Response
    {
        if ($flash) {
            session()->flash('success', $flash);
        }

        // Get action from controller if possible
        $controller = $this;
        $page = method_exists($controller, 'getPage') ? $controller->getPage($action) : $action;

        return \Inertia\Inertia::render($page, [
            'views'   => $this->getViewsConfig($action),
            'configs' => $this->getModelConfigs(),
            ...$extra,
        ]);
    }

    /**
     * Redirect to index route with a flash message.
     */
    protected function redirectToIndex(string $message): \Illuminate\Http\RedirectResponse
    {
        $routeName = method_exists($this, 'getRouteName') ? $this->getRouteName('index') : 'admin.dashboard';

        return redirect()->route($routeName)->with('success', $message);
    }

    /**
     * Build pagination meta array (empty if not paginated).
     */
    protected function buildPaginationMeta($items): array
    {
        if (! $items instanceof \Illuminate\Contracts\Pagination\LengthAwarePaginator) {
            return [];
        }

        return ['pagination' => Resource::extractPagination($items)];
    }
}
