import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@core/components/ui/select';
import { Languages } from 'lucide-react';
import { HTMLAttributes } from 'react';
import { usePage } from '@inertiajs/react';
import { useTranslation } from '../hooks/use-translation';
import { type SharedData } from '@core/types';
import { cn } from '@core/lib/utils';

export default function LocaleSwitcher({
    className = '',
    ...props
}: HTMLAttributes<HTMLDivElement>) {
    const { locale, changeLanguage } = useTranslation();
    const { locales = ['en', 'vi'] } = usePage<SharedData>().props;

    const availableLocales = Array.isArray(locales) ? locales : ['en', 'vi'];
    const currentLocale = (locale || availableLocales[0]) ?? 'en';

    return (
        <div className={className} {...props}>
            <Select value={currentLocale} onValueChange={changeLanguage}>
                <SelectTrigger
                    className="h-9 gap-2 px-4 min-w-[90px] hover:bg-accent/50 transition-all duration-300 border-transparent hover:border-border/50 rounded-lg group shadow-none"
                >
                    <div className="flex items-center gap-2">
                        <Languages className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        <span className="font-semibold text-xs tracking-wider uppercase">
                            <SelectValue placeholder={currentLocale.toUpperCase()} />
                        </span>
                    </div>
                </SelectTrigger>
                <SelectContent 
                    align="end" 
                    className="min-w-32 p-1 bg-background/90 backdrop-blur-2xl border-border/50 shadow-2xl rounded-xl"
                >
                    {availableLocales.map((code) => (
                        <SelectItem
                            key={code}
                            value={code}
                            className={cn(
                                'flex items-center justify-between px-3 py-2 cursor-pointer rounded-lg transition-all',
                                'focus:bg-primary/10 focus:text-primary data-[state=checked]:bg-primary/5 data-[state=checked]:text-primary data-[state=checked]:font-bold'
                            )}
                        >
                            <span className="text-[10px] font-bold tracking-widest">
                                {code.toUpperCase()}
                            </span>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}

