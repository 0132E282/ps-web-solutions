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
    return (
        <div className={cn("flex items-center gap-2", className)}>
            <div className="flex items-center gap-1.5 ml-auto">
                {isEdit && showDuplicate && onDuplicate && (
                    <ActionButton
                        onClick={onDuplicate}
                        disabled={disabled}
                        variant="outline"
                        icon={Copy}
                        label={tt('common.duplicate') || 'Nhân bản'}
                        className="border-transparent hover:border-border/50 hover:bg-accent/40 shadow-none px-4"
                        iconClassName="text-muted-foreground"
                    />
                )}

                {isEdit && showDelete && onDelete && (
                    <ActionButton
                        onClick={onDelete}
                        disabled={disabled}
                        variant="ghost"
                        icon={Trash2}
                        label={tt('common.delete') || 'Xóa'}
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive px-4"
                    />
                )}

                {(onSave || locale) && <Separator />}

                {onSave && (
                    <ActionButton
                        onClick={onSave}
                        disabled={disabled}
                        icon={Save}
                        label={isEdit ? (tt('common.save_changes') || 'Lưu thay đổi') : (tt('common.create') || 'Tạo mới')}
                        className="bg-primary hover:bg-primary/90 shadow-md shadow-primary/20 px-4"
                        labelClassName="font-bold"
                    />
                )}

                {locale && (
                    <>
                        <Separator />
                        <LocaleSwitcher />
                    </>
                )}
            </div>

            {layouts.length > 1 && (
                <div className="ml-2">
                    <ToggleGroup
                        type="single"
                        value={viewMode}
                        onValueChange={(val) => val && onViewModeChange?.(val)}
                        className="bg-muted/30 p-1 rounded-xl border border-border/50 shadow-sm h-10 backdrop-blur-sm"
                    >
                        {layouts.includes('table') && (
                            <ViewModeItem value="table" icon={List} label="Table View" />
                        )}
                        {layouts.includes('tree') && (
                            <ViewModeItem value="tree" icon={Network} label="Tree View" />
                        )}
                    </ToggleGroup>
                </div>
            )}
        </div>
    );
};

/**
 * # Helper Components for Clean Code
 */

const ActionButton = ({ 
    icon: Icon, 
    label, 
    className, 
    labelClassName,
    iconClassName,
    ...props 
}: React.ComponentProps<typeof Button> & { 
    icon: LucideIcon; 
    label: string; 
    labelClassName?: string;
    iconClassName?: string;
}) => (
    <Button
        type="button"
        size="sm"
        className={cn("gap-2 transition-all duration-300 rounded-lg", className)}
        {...props}
    >
        <Icon className={cn("h-4 w-4", iconClassName)} />
        <span className={cn("font-semibold", labelClassName)}>{label}</span>
    </Button>
);

const ViewModeItem = ({ value, icon: Icon, label }: { value: string; icon: LucideIcon; label: string }) => (
    <ToggleGroupItem
        value={value}
        aria-label={label}
        size="sm"
        className="h-8 w-9 px-0 data-[state=on]:bg-background data-[state=on]:text-primary data-[state=on]:shadow-sm rounded-lg transition-all"
    >
        <Icon className="h-4 w-4" />
    </ToggleGroupItem>
);

const Separator = () => <div className="h-4 w-px bg-border/40 mx-1" />;

export default ToolbarFormPage;
