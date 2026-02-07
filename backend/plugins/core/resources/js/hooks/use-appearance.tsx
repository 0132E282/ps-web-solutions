import { useEffect, useState } from 'react';

type Appearance = 'light' | 'dark' | 'system';

export function useAppearance() {
    const [appearance, setAppearance] = useState<Appearance>(() => {
        return (localStorage.getItem('theme') as Appearance) || 'system';
    });

    useEffect(() => {
        applyTheme(appearance);
    }, [appearance]);

    const updateAppearance = (newAppearance: Appearance) => {
        localStorage.setItem('theme', newAppearance);
        setAppearance(newAppearance);
    };

    return { appearance, updateAppearance };
}

function applyTheme(theme: Appearance) {
    const isDark =
        theme === 'dark' ||
        (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDark) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
}

export function initializeTheme() {
    const theme = (localStorage.getItem('theme') as Appearance) || 'system';
    applyTheme(theme);
}
