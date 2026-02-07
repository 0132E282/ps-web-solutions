import { route } from "./route";
import { tt } from "./i18n";
import type { BreadcrumbItem } from "@core/types/common";

/**
 * Get translated text with fallback
 */
function getBreadcrumbTitle(key: string, fallback: string): string {
    const translated = tt(key);
    // If translation returns the key itself, use fallback
    if (translated === key || translated.startsWith('breadcrumb.')) {
        return fallback;
    }
    return translated;
}

/**
 * Get default breadcrumbs (Dashboard)
 */
function getDefaultBreadcrumbs(): BreadcrumbItem[] {
    const dashboardTitle = getBreadcrumbTitle('breadcrumb.dashboard', 'Dashboard');

    return [
        {
            title: dashboardTitle,
            href: route('admin.site.dashboard') || '/dashboard',
        },
    ];
}

/**
 * Generate breadcrumbs from route name
 * Example: "admin.admins.edit" -> [
 *   { title: "Dashboard", href: "/dashboard" },
 *   { title: "Admin", href: "/admin" },
 *   { title: "Admins", href: "/admin/admins" },
 *   { title: "Edit" }
 * ]
 */
export function generateBreadcrumbsFromRoute(
    routeName: string | null | undefined,
    currentId?: string | number,
    itemData?: Record<string, unknown> | null
): BreadcrumbItem[] {
    if (!routeName) return getDefaultBreadcrumbs();

    const parts = routeName.split('.');
    if (parts.length === 0) return getDefaultBreadcrumbs();

    const breadcrumbs: BreadcrumbItem[] = [];
    const action = parts[parts.length - 1];

    // For routes like "admin.cms.posts.index" or "admin.posts.index"
    if (parts.length >= 3) {
        // Get the last resource name (skip prefix and intermediate parts like "cms")
        // For "admin.cms.posts.index", we want "posts"
        // For "admin.posts.index", we want "posts"
        const resourceName = parts[parts.length - 2]; // Last part before action

        if (!resourceName) return getDefaultBreadcrumbs();

        // Skip prefix "admin" - don't add it to breadcrumbs
        // Only add resource (e.g., "Posts")
        const resourceTitle = getBreadcrumbTitle(
            `breadcrumb.${resourceName}`,
            resourceName.charAt(0).toUpperCase() + resourceName.slice(1)
        );

        // Build route name for resource index
        const resourceRouteName = parts.slice(0, -1).join('.') + '.index';
        breadcrumbs.push({
            title: resourceTitle,
            href: route(resourceRouteName),
        });

        // Add action if not "index"
        if (action && action !== 'index') {
            // For show page, use item title/name if available
            let actionTitle: string;
            if (action === 'show' && itemData) {
                const itemTitle = itemData.title || itemData.name;

                actionTitle = typeof itemTitle === 'string' && itemTitle.trim() ? itemTitle.trim() : getBreadcrumbTitle(
                    `breadcrumb.${action}`,
                    action.charAt(0).toUpperCase() + action.slice(1)
                );
            } else {

                actionTitle = getBreadcrumbTitle(
                    `breadcrumb.${action}`,
                    action.charAt(0).toUpperCase() + action.slice(1)
                );
            }
            breadcrumbs.push({
                title: actionTitle,
            });
        }
    }
    // For routes like "admins.index" or "admins.create" (2 parts)
    else if (parts.length === 2) {
        const resourceName = parts[0]; // "admins"
        const action = parts[1]; // "index" or "create"

        if (!resourceName) return getDefaultBreadcrumbs();

        // Add resource
        const resourceTitle = getBreadcrumbTitle(
            `breadcrumb.${resourceName}`,
            resourceName.charAt(0).toUpperCase() + resourceName.slice(1)
        );
        breadcrumbs.push({
            title: resourceTitle,
            href: route(`${resourceName}.index`),
        });

        // Add action if not "index"
        if (action && action !== 'index') {
            // For show page, use item title/name if available
            let actionTitle: string;
            if (action === 'show' && itemData) {
                const itemTitle = itemData.title || itemData.name;
                if (process.env.NODE_ENV === 'development') {
                    console.log('[Breadcrumbs] Show page (2 parts) - itemData:', itemData, 'itemTitle:', itemTitle);
                }
                actionTitle = typeof itemTitle === 'string' && itemTitle.trim() ? itemTitle : getBreadcrumbTitle(
                    `breadcrumb.${action}`,
                    action.charAt(0).toUpperCase() + action.slice(1)
                );
            } else {
                actionTitle = getBreadcrumbTitle(
                    `breadcrumb.${action}`,
                    action.charAt(0).toUpperCase() + action.slice(1)
                );
            }
            breadcrumbs.push({
                title: actionTitle,
            });
        }
    }
    // For single part routes (e.g., "dashboard")
    else if (parts.length === 1) {
        const routePart = parts[0];
        if (!routePart) return getDefaultBreadcrumbs();

        // Skip default breadcrumbs if already on dashboard
        if (routePart === 'dashboard') {
            const title = getBreadcrumbTitle(
                `breadcrumb.${routePart}`,
                routePart.charAt(0).toUpperCase() + routePart.slice(1)
            );
            return [{ title, href: route(routePart) }];
        }

        const title = getBreadcrumbTitle(
            `breadcrumb.${routePart}`,
            routePart.charAt(0).toUpperCase() + routePart.slice(1)
        );
        breadcrumbs.push({
            title,
            href: route(routePart),
        });
    }

    // Prepend default breadcrumbs (Dashboard) if not already present
    const defaultBreadcrumbs = getDefaultBreadcrumbs();
    const firstBreadcrumb = breadcrumbs[0];

    // Only add defaults if first breadcrumb is not dashboard
    if (
        firstBreadcrumb &&
        firstBreadcrumb.href !== route('admin.site.dashboard') &&
        firstBreadcrumb.title !== getBreadcrumbTitle('breadcrumb.dashboard', 'Dashboard')
    ) {
        return [...defaultBreadcrumbs, ...breadcrumbs];
    }

    return breadcrumbs.length > 0 ? breadcrumbs : defaultBreadcrumbs;
}

/**
 * Get breadcrumbs from config or generate from route
 */
export function getBreadcrumbs(
    configBreadcrumbs?: BreadcrumbItem[],
    routeName?: string | null,
    currentId?: string | number,
    itemData?: Record<string, unknown> | null
): BreadcrumbItem[] {
    // If breadcrumbs are provided in config, use them
    if (configBreadcrumbs && configBreadcrumbs.length > 0) {
        return configBreadcrumbs;
    }

    // Otherwise, generate from route
    return generateBreadcrumbsFromRoute(routeName, currentId, itemData);
}

