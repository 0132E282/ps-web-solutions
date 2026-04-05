import { Save, Trash2, Copy, List, Network, LucideIcon } from "lucide-react";
import { Button } from "@core/components/ui/button";
import { cn } from "@core/lib/utils";
import { tt } from "@core/lib/i18n";
import { ToggleGroup, ToggleGroupItem } from "@core/components/ui/toggle-group";
import LocaleSwitcher from "../locale-switcher";

interface ToolbarFormPageProps {
    className?: string;
    isEdit?: boolean;
    onSave?: () => void;
    onDelete?: () => void;
    onDuplicate?: () => void;
    showDelete?: boolean;
    showDuplicate?: boolean;
    locale?: boolean;
    disabled?: boolean;
    layouts?: string[];
    viewMode?: string;
    onViewModeChange?: (mode: string) => void;
}

const ToolbarFormPage = ({
    className = "",
    isEdit = false,
    onSave,
    onDelete,
    onDuplicate,
    showDelete = true,
    showDuplicate = true,
    locale = true,
    disabled = false,
    layouts = [],
    viewMode = "table",
    onViewModeChange,
}: ToolbarFormPageProps) => {
    const hasSecondaryActions = isEdit && ((showDuplicate && onDuplicate) || (showDelete && onDelete));

    return (
        <div className={cn("flex items-center gap-2", className)}>
            {/* View Mode Toggle — left side */}
            {layouts.length > 1 && (
                <ToggleGroup
                    type="single"
                    value={viewMode}
                    onValueChange={(val) => val && onViewModeChange?.(val)}
                    className="bg-muted/40 p-1 rounded-xl border border-border/40 h-9"
                >
                    {layouts.includes('table') && (
                        <ViewModeItem value="table" icon={List} label="Table View" />
                    )}
                    {layouts.includes('tree') && (
                        <ViewModeItem value="tree" icon={Network} label="Tree View" />
                    )}
                </ToggleGroup>
            )}

            {/* Right-side actions */}
            <div className="flex items-center gap-1.5 ml-auto">

                {/* Secondary actions — Duplicate & Delete grouped */}
                {hasSecondaryActions && (
                    <SecondaryActionsGroup
                        isEdit={isEdit}
                        disabled={disabled}
                        showDuplicate={showDuplicate}
                        showDelete={showDelete}
                        onDuplicate={onDuplicate}
                        onDelete={onDelete}
                    />
                )}

                {/* Save button */}
                {onSave && (
                    <Button
                        type="button"
                        size="sm"
                        onClick={onSave}
                        disabled={disabled}
                        className={cn(
                            "gap-2 px-5 h-9 rounded-xl font-semibold text-sm",
                            "bg-primary hover:bg-primary/90 active:scale-[0.97]",
                            "shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/25",
                            "transition-all duration-200"
                        )}
                    >
                        <Save className="h-3.5 w-3.5" />
                        {isEdit
                            ? (tt('common.save_changes') || 'Lưu thay đổi')
                            : (tt('common.create') || 'Tạo mới')
                        }
                    </Button>
                )}

                {/* Language switcher */}
                {locale && (
                    <>
                        <div className="h-5 w-px bg-border/40 mx-0.5" />
                        <LocaleSwitcher />
                    </>
                )}
            </div>
        </div>
    );
};

/**
 * Secondary actions group — shows inline on ≥2 actions, else single button
 */
const SecondaryActionsGroup = ({
    isEdit,
    disabled,
    showDuplicate,
    showDelete,
    onDuplicate,
    onDelete,
}: {
    isEdit?: boolean;
    disabled?: boolean;
    showDuplicate?: boolean;
    showDelete?: boolean;
    onDuplicate?: () => void;
    onDelete?: () => void;
}) => {
    const hasDuplicate = isEdit && showDuplicate && onDuplicate;
    const hasDelete = isEdit && showDelete && onDelete;
    const both = hasDuplicate && hasDelete;

    if (!hasDuplicate && !hasDelete) return null;

    // Both actions: show a split button group
    if (both) {
        return (
            <div className="flex items-center rounded-xl border border-border/50 overflow-hidden divide-x divide-border/50 bg-background/60 shadow-sm">
                <ActionIconButton
                    icon={Copy}
                    label={tt('common.duplicate') || 'Nhân bản'}
                    onClick={onDuplicate!}
                    disabled={disabled}
                    className="rounded-none text-muted-foreground hover:text-foreground hover:bg-accent/50"
                />
                <ActionIconButton
                    icon={Trash2}
                    label={tt('common.delete') || 'Xóa'}
                    onClick={onDelete!}
                    disabled={disabled}
                    className="rounded-none text-destructive/70 hover:text-destructive hover:bg-destructive/8"
                />
            </div>
        );
    }

    // Single action
    if (hasDuplicate) {
        return (
            <ActionIconButton
                icon={Copy}
                label={tt('common.duplicate') || 'Nhân bản'}
                onClick={onDuplicate!}
                disabled={disabled}
                className="border border-border/50 bg-background/60 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent/50 shadow-sm"
            />
        );
    }

    return (
        <ActionIconButton
            icon={Trash2}
            label={tt('common.delete') || 'Xóa'}
            onClick={onDelete!}
            disabled={disabled}
            className="border border-border/50 bg-background/60 rounded-xl text-destructive/70 hover:text-destructive hover:bg-destructive/8 shadow-sm"
        />
    );
};

/**
 * Icon-only button with tooltip-style title
 */
const ActionIconButton = ({
    icon: Icon,
    label,
    className,
    ...props
}: React.ComponentProps<typeof Button> & {
    icon: LucideIcon;
    label: string;
}) => (
    <Button
        type="button"
        variant="ghost"
        size="icon"
        title={label}
        aria-label={label}
        className={cn(
            "h-9 w-9 transition-all duration-200 active:scale-95",
            className
        )}
        {...props}
    >
        <Icon className="h-4 w-4" />
    </Button>
);

const ViewModeItem = ({ value, icon: Icon, label }: { value: string; icon: LucideIcon; label: string }) => (
    <ToggleGroupItem
        value={value}
        aria-label={label}
        size="sm"
        className="h-7 w-8 px-0 data-[state=on]:bg-background data-[state=on]:text-primary data-[state=on]:shadow-sm rounded-lg transition-all"
    >
        <Icon className="h-3.5 w-3.5" />
    </ToggleGroupItem>
);

export default ToolbarFormPage;
