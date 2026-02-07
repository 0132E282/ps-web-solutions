import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import type { ComponentType } from 'react';

// Type for Inertia page component (can be default export or named export)
type PageComponent = ComponentType<Record<string, unknown>> | { default?: ComponentType<Record<string, unknown>> };

// Cache for resolved pages and failed lookups
const pageCache = new Map<string, PageComponent>();
const failedCache = new Set<string>();

// Patterns to match page paths (full paths and relative paths)
const PAGE_PATTERNS = {
    capital: [/resources\/Pages\/(.+)$/, /\.\.\/Pages\/(.+)$/, /Pages\/(.+)$/],
    lower: [/resources\/js\/pages\/(.+)$/, /\.\.\/pages\/(.+)$/, /pages\/(.+)$/],
} as const;

/**
 * Extract file path from a glob path using patterns or direct extraction
 */
function extractFilePath(path: string, patterns: readonly RegExp[]): string | null {
    for (const pattern of patterns) {
        const match = path.match(pattern);
        if (match?.[1]) {
            return match[1].replace(/\\/g, '/');
        }
    }

    // Fallback: direct extraction for relative paths
    const pagesIndex = path.indexOf('/pages/');
    if (pagesIndex !== -1) {
        return path.substring(pagesIndex + 7).replace(/\\/g, '/');
    }

    const pagesIndexAlt = path.indexOf('pages/');
    if (pagesIndexAlt !== -1) {
        return path.substring(pagesIndexAlt + 6).replace(/\\/g, '/');
    }

    return null;
}

/**
 * Check if path belongs to a specific plugin
 */
function isPluginPath(path: string, pluginName: string): boolean {
    const pathLower = path.toLowerCase();
    const pluginLower = pluginName.toLowerCase();

    return (
        // Typical plugin structure: plugins/<pluginName>/...
        pathLower.includes(`/plugins/${pluginLower}/`) ||
        pathLower.includes(`plugins/${pluginLower}/`) ||
        // Some build setups (like current cms) expose paths without "plugins/" prefix,
        // e.g. "../../../../cms/resources/js/pages/..."
        pathLower.includes(`/${pluginLower}/resources/js/pages/`) ||
        pathLower.includes(`/${pluginLower}/resources/pages/`) ||
        (pluginLower === 'core' && (pathLower.includes('/core/') || pathLower.includes('core/') || pathLower.includes('../pages/')))
    );
}

/**
 * Match extracted path with target path
 */
function matchesTarget(extractedPath: string, targetPath: string, isCore: boolean): boolean {
    const normalized = extractedPath.replace(/\\/g, '/');
    const target = targetPath.replace(/\\/g, '/');

    if (isCore) {
        const targetWithoutExt = target.replace(/\.tsx$/, '');
        return normalized === targetWithoutExt ||
               normalized === `${targetWithoutExt}/index` ||
               normalized === `${targetWithoutExt}.tsx` ||
               normalized === `${targetWithoutExt}/index.tsx` ||
               normalized.endsWith(`/${targetWithoutExt}`) ||
               normalized.endsWith(`/${targetWithoutExt}/index`) ||
               normalized.endsWith(`/${targetWithoutExt}.tsx`) ||
               normalized.endsWith(`/${targetWithoutExt}/index.tsx`);
    }

    const normalizedLower = normalized.toLowerCase();
    const targetLower = target.toLowerCase();
    const targetWithoutExt = targetLower.replace(/\.tsx$/, '');
    return normalizedLower === targetWithoutExt ||
           normalizedLower === `${targetWithoutExt}/index` ||
           normalizedLower === `${targetWithoutExt}.tsx` ||
           normalizedLower === `${targetWithoutExt}/index.tsx` ||
           normalizedLower.endsWith(`/${targetWithoutExt}`) ||
           normalizedLower.endsWith(`/${targetWithoutExt}/index`) ||
           normalizedLower.endsWith(`/${targetWithoutExt}.tsx`) ||
           normalizedLower.endsWith(`/${targetWithoutExt}/index.tsx`);
}

/**
 * Resolve page from a specific source
 */
async function resolveFromSource(
    pages: Record<string, () => Promise<PageComponent>>,
    patterns: readonly RegExp[],
    targetPath: string,
    pluginMatch: RegExpMatchArray | null,
): Promise<PageComponent | null> {
    const pluginName = pluginMatch?.[1]?.toLowerCase() || '';
    const isCore = pluginName === 'core';

    for (const [path, loader] of Object.entries(pages)) {
        // Filter by plugin if needed
        if (pluginMatch && !isPluginPath(path, pluginName)) {
            continue;
        }

        // Extract file path
        const extractedPath = extractFilePath(path, patterns);
        if (!extractedPath) {
            continue;
        }

        // Match with target
        if (matchesTarget(extractedPath, targetPath, isCore)) {

            const module = await loader();
            if (!module) return null;
            // Handle both default export and named export
            const component = (typeof module === 'object' && 'default' in module) ? module.default : module;
            return component ?? null;
        }
    }

    return null;
}

/**
 * Resolve plugin pages with caching
 */
export async function resolvePluginPages(
    name: string,
    mainPages: Record<string, () => Promise<PageComponent>>,
    pluginPagesCapital: Record<string, () => Promise<PageComponent>>,
    pluginPagesLower: Record<string, () => Promise<PageComponent>>,
): Promise<PageComponent | null> {
    // Check cache
    if (pageCache.has(name)) {
        return pageCache.get(name) ?? null;
    }

    if (failedCache.has(name)) {
        return null;
    }

    // 1. Try Main Pages first (Case-insensitive)
    // We combine patterns to check both lower and capital structures in main pages
    const mainResult = await resolveFromSource(
        mainPages,
        [...PAGE_PATTERNS.lower, ...PAGE_PATTERNS.capital],
        `${name}.tsx`,
        null
    );

    if (mainResult) {
        pageCache.set(name, mainResult);
        return mainResult;
    }

    // 2. Fallback for Main Pages using direct Inertia resolve
    // This handles cases where file structure might closely match the name
    try {
        const module = await resolvePageComponent(`./pages/${name}.tsx`, mainPages).catch(() => null);
        if (module) {
            const mainPage = (typeof module === 'object' && 'default' in module) ? module.default : module;
            if (mainPage) {
                pageCache.set(name, mainPage as PageComponent);
                return mainPage as PageComponent;
            }
        }
    } catch (error) {
        // Ignore errors
    }

    // 3. Try Plugin Pages
    const pluginMatch = name.match(/^([^/]+)\/(.+)$/);

    // If it's a plugin page (has slash)
    if (pluginMatch) {
        console.log('[RESOLVE] Resolving plugin page:', name);

        // Build target path
        const targetPath = pluginMatch[2]
            ? `${pluginMatch[1].toLowerCase() === 'core' ? pluginMatch[2] : pluginMatch[2].toLowerCase()}.tsx`
            : `${name}.tsx`;

        // Try plugin pages
        const pageSources = [
            { pages: pluginPagesCapital, patterns: PAGE_PATTERNS.capital },
            { pages: pluginPagesLower, patterns: PAGE_PATTERNS.lower },
        ];

        for (const { pages, patterns } of pageSources) {
            const result = await resolveFromSource(pages, patterns, targetPath, pluginMatch);
            if (result) {
                pageCache.set(name, result);
                return result;
            }
        }
    }

    // Cache failure
    failedCache.add(name);
    console.error('Page not found:', name);
    return null;
}
