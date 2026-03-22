import { TriangleAlert } from "lucide-react";
import { Button } from "@core/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@core/components/ui/dialog";
import { tt } from "@core/lib/i18n";

interface ConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmLabel: string;
    variant?: 'default' | 'destructive';
    isLoading?: boolean;
    count?: number;
    icon?: boolean;
    descriptionClassName?: string;
}

export const ConfirmDialog = ({
    open, onOpenChange, onConfirm,
    title, description, confirmLabel,
    variant = 'default', isLoading = false,
    count, icon = false, descriptionClassName,
}: ConfirmDialogProps) => (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
            <DialogHeader>
                {icon ? (
                    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                        <div className="mx-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                            <TriangleAlert className="h-6 w-6 text-red-600" aria-hidden="true" />
                        </div>
                        <div className="text-center sm:ml-4 sm:text-left">
                            <DialogTitle className="text-lg font-semibold text-foreground">{title}</DialogTitle>
                            <DialogDescription className={descriptionClassName ?? "text-muted-foreground mt-2"}>
                                {description}
                                {count !== undefined && (
                                    <span className="block mt-2 font-medium text-foreground">{tt("common.selected_items")}: {count}</span>
                                )}
                            </DialogDescription>
                        </div>
                    </div>
                ) : (
                    <>
                        <DialogTitle className="text-lg font-semibold text-foreground">{title}</DialogTitle>
                        <DialogDescription className={descriptionClassName ?? "text-muted-foreground mt-2"}>
                            {description}
                            {count !== undefined && (
                                <span className="block mt-2 font-medium text-foreground">{tt("common.selected_items")}: {count}</span>
                            )}
                        </DialogDescription>
                    </>
                )}
            </DialogHeader>
            <DialogFooter className="sm:justify-end gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>{tt("common.cancel") || "Hủy"}</Button>
                <Button variant={variant} onClick={onConfirm} disabled={isLoading}>
                    {isLoading ? tt("common.loading") : confirmLabel}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
);
