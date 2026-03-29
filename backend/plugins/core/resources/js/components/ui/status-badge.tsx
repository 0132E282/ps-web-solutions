import { cn } from '@core/lib/utils';

export interface StatusOption {
    label: string;
    value: string | number;
    color?: string;
    'text-color'?: string;
}

interface StatusBadgeProps {
    value: string | number | null | undefined;
    options?: StatusOption[];
    className?: string;
}

export const StatusBadge = ({ value, options, className }: StatusBadgeProps) => {
    if (value == null || value === '') return null;

    const option = options?.find(o => String(o.value) === String(value));
    const label = option?.label || String(value);
    const color = option?.color;
    const textColor = option?.['text-color'];

    if (color) {
        return (
            <span
                className={cn('inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded-md shrink-0', className)}
                style={{ backgroundColor: color, color: textColor || '#fff' }}
            >
                {label}
            </span>
        );
    }

    return (
        <span className={cn('inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-primary text-white shrink-0', className)}>
            {label}
        </span>
    );
};
