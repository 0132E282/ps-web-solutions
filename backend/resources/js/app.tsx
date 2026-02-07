
import '../css/app.css';

// Auto-register fields from plugins
import.meta.glob('../../plugins/*/resources/js/components/fields/*.tsx', { eager: true });

import { initializeTheme } from '@core/hooks/use-appearance';
import { setupInertiaApp } from '@core/lib/inertia';

setupInertiaApp({
    progress: {
        color: '#4B5563',
    },
});

initializeTheme();

