/**
 * Auto-detect page glob patterns by trying different depth levels
 * Automatically finds the correct relative path to plugins directory
 * Note: import.meta.glob requires static string literals
 */

type PageModule = () => Promise<{ default: React.ComponentType<unknown> }>;

interface PageGlobs {
    mainPages: Record<string, PageModule>;
    pluginPagesCapital: Record<string, PageModule>;
    pluginPagesLower: Record<string, PageModule>;
}

interface GlobAttempt extends PageGlobs {
    depth: number;
}

/**
 * Create glob patterns for a specific depth
 * Note: Must use static string literals, cannot use template literals
 * Also includes core plugin's own pages
 */
function createGlobAttempt(
    depth: number,
    mainPages: Record<string, PageModule>,
    pluginPagesCapital: Record<string, PageModule>,
    pluginPagesLower: Record<string, PageModule>,
    corePages?: Record<string, PageModule>,
): GlobAttempt {
    // Merge core pages into pluginPagesLower if provided
    const mergedPluginPagesLower = corePages
        ? { ...pluginPagesLower, ...corePages }
        : pluginPagesLower;

    return { depth, mainPages, pluginPagesCapital, pluginPagesLower: mergedPluginPagesLower };
}

/**
 * Count files in glob patterns
 */
function countGlobs(attempt: GlobAttempt) {
    return {
        pluginLower: Object.keys(attempt.pluginPagesLower).length,
        pluginCapital: Object.keys(attempt.pluginPagesCapital).length,
        mainPages: Object.keys(attempt.mainPages).length,
    };
}

/**
 * Check if attempt has plugin pages
 */
function hasPluginPages(attempt: GlobAttempt): boolean {
    const counts = countGlobs(attempt);
    return counts.pluginLower > 0 || counts.pluginCapital > 0;
}

/**
 * Auto-detect page glob patterns
 */
export function getPageGlobsAuto(): PageGlobs {
    // Try different depth levels - must use static string literals
    // Paths are relative to plugins/core/resources/js/lib/glob-patterns.ts
    // Also include core plugin's own pages (../pages/**/*.tsx)

    // Debug: Log that we're evaluating globs
    const isDev = typeof process !== 'undefined' && process.env?.NODE_ENV === 'development';
    if (isDev) {
        console.log('[getPageGlobsAuto] Evaluating glob patterns...');
        console.log('[getPageGlobsAuto] Current file location: plugins/core/resources/js/lib/glob-patterns.ts');
    }

    // Auto-discover all plugins using glob patterns
    // Note: Vite requires static string literals for import.meta.glob
    // We use a wildcard pattern to match all plugins: plugins/*/resources/js/pages/**/*.tsx
    const pluginPagesLower = {
        // @ts-expect-error - Vite feature
        ...import.meta.glob('../../../../core/resources/js/pages/**/*.tsx', { eager: false }),
        // @ts-expect-error - Vite feature
        ...import.meta.glob('../../../../*/resources/js/pages/**/*.tsx', { eager: false }),
    };

    const pluginPagesCapital = {
        // @ts-expect-error - Vite feature
        ...import.meta.glob('../../../../core/resources/Pages/**/*.tsx', { eager: false }),
        // @ts-expect-error - Vite feature
        ...import.meta.glob('../../../../*/resources/Pages/**/*.tsx', { eager: false }),
    };

    const attempts: GlobAttempt[] = [
        createGlobAttempt(
            5,
            // @ts-expect-error - Vite feature
            import.meta.glob('../../../../../resources/js/pages/**/*.tsx'),
            pluginPagesCapital,
            pluginPagesLower,
        ),
        createGlobAttempt(
            4,
            // @ts-expect-error - Vite feature
            import.meta.glob('../../../../resources/js/pages/**/*.tsx'),
            pluginPagesCapital,
            pluginPagesLower,
        ),
    ];


    // First, try to find attempts with plugin pages (most reliable indicator)
    for (const attempt of attempts) {
        const counts = countGlobs(attempt);
        if (isDev) {
            console.log(`[getPageGlobsAuto] Checking depth ${attempt.depth}:`, {
                pluginLower: counts.pluginLower,
                pluginCapital: counts.pluginCapital,
                mainPages: counts.mainPages,
                samplePluginLowerPaths: Object.keys(attempt.pluginPagesLower).slice(0, 5),
                samplePluginCapitalPaths: Object.keys(attempt.pluginPagesCapital).slice(0, 5),
            });
        }

        if (hasPluginPages(attempt)) {
            if (isDev) {
                console.log('✅ Found glob patterns with plugin pages:', {
                    depth: attempt.depth,
                    ...counts,
                    samplePaths: Object.keys(attempt.pluginPagesLower).slice(0, 5),
                });
            }
            return {
                mainPages: attempt.mainPages,
                pluginPagesCapital: attempt.pluginPagesCapital,
                pluginPagesLower: attempt.pluginPagesLower,
            };
        }
    }

    // Fallback: return first attempt with any pages (mainPages only)
    for (const attempt of attempts) {
        const counts = countGlobs(attempt);
        if (counts.mainPages > 0) {
            if (isDev) {
                console.warn('⚠️ Found only mainPages, no plugin pages. Depth:', attempt.depth, counts);
            }
            return {
                mainPages: attempt.mainPages,
                pluginPagesCapital: attempt.pluginPagesCapital,
                pluginPagesLower: attempt.pluginPagesLower,
            };
        }
    }

    // Return empty globs as last resort
    if (isDev) {
        console.error('❌ No glob patterns found! All attempts returned empty.');
    }
    return {
        mainPages: {},
        pluginPagesCapital: {},
        pluginPagesLower: {},
    };
}
