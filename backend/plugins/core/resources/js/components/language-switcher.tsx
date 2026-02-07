import { Button } from '@core/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@core/components/ui/dropdown-menu';
import { Languages, Check } from 'lucide-react';
import { HTMLAttributes } from 'react';
import { usePage } from '@inertiajs/react';
import { useTranslation } from '../hooks/use-translation';
import { type SharedData } from '@core/types';
import { cn } from '@core/lib/utils';

export default function LanguageSwitcher({
    className = '',
    ...props
}: HTMLAttributes<HTMLDivElement>) {
    const { locale, changeLanguage } = useTranslation();
    const { locales = ['en', 'vi'] } = usePage<SharedData>().props;

    const availableLocales = Array.isArray(locales) ? locales : ['en', 'vi'];
    const currentLocale = (locale || availableLocales[0]) ?? 'en';

    return (
        <div className={className} {...props}>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 gap-2 px-4 min-w-[80px] hover:bg-accent/50 transition-colors"
                    >
                        <Languages className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-sm">
                            {currentLocale.toUpperCase()}
                        </span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-32">
                    {availableLocales.map((code) => {
                        const isSelected = locale === code;
                        return (
                            <DropdownMenuItem
                                key={code}
                                onClick={() => changeLanguage(code)}
                                className={cn(
                                    'flex items-center justify-between gap-2 cursor-pointer',
                                    isSelected && 'bg-accent font-medium'
                                )}
                            >
                                <span className="text-sm">{code.toUpperCase()}</span>
                                {isSelected && (
                                    <Check className="h-4 w-4 text-primary" />
                                )}
                            </DropdownMenuItem>
                        );
                    })}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}

