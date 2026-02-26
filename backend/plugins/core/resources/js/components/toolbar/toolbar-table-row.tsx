import { Button } from "@core/components/ui/button";
import { Trash2, Copy, RefreshCcw, XCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@core/components/ui/dialog";
import { useMemo, useState } from "react";

import { getCurrentRouteName } from "@core/lib/route";
import { tt } from "@core/lib/i18n";
import { useModule } from "@core/hooks/use-module";
import { useDispatch } from "react-redux";
import {
    duplicateResourceRequest,
    restoreResourceRequest,
    forceDeleteResourceRequest,
    deleteResourceRequest
} from "../../redux/slices/resourceSlice";

import { usePage } from "@inertiajs/react";
// ... imports

interface ToolbarDataTableRowProps {
    row: Record<string, unknown> & { id: number | string };
}

type ActionType = 'delete' | 'duplicate' | 'restore' | 'forceDelete' | null;

const ToolbarDataTableRow = ({ row }: ToolbarDataTableRowProps) => {
    const dispatch = useDispatch();
    const { crudRoutes, views } = useModule();
    const [confirmAction, setConfirmAction] = useState<ActionType>(null);
    const { props } = usePage();

    // Align with hooks.ts logic to ensure Redux key matching
    const currentRouteName = props.ziggy?.route?.name || getCurrentRouteName();
    const isTrash = currentRouteName?.endsWith('.trash');

    // Use the current route name (e.g. admin.posts.index) as the resource key
    const resourceName = useMemo(() => {
        return currentRouteName || crudRoutes.index || crudRoutes.show || '';
    }, [currentRouteName, crudRoutes]);

    const actions = {
        duplicate: {
            title: tt('common.confirm_duplicate') || 'Xác nhận nhân bản',
            description: tt('common.confirm_duplicate_message') || 'Bạn có chắc chắn muốn nhân bản bản ghi này không?',
            icon: <Copy className="h-4 w-4" />,
            variant: 'default' as const,
            label: tt('common.duplicate') || 'Nhân bản',
            handler: () => dispatch(duplicateResourceRequest({ resource: resourceName!, id: row.id }))
        },
        restore: {
            title: tt('common.confirm_restore') || 'Xác nhận khôi phục',
            description: tt('common.confirm_restore_message') || 'Bạn có chắc chắn muốn khôi phục bản ghi này không?',
            icon: <RefreshCcw className="h-4 w-4" />,
            variant: 'default' as const,
            label: tt('common.restore') || 'Khôi phục',
            handler: () => dispatch(restoreResourceRequest({ resource: resourceName!, id: row.id }))
        },
        forceDelete: {
            title: tt('common.confirm_force_delete') || 'Xác nhận xóa vĩnh viễn',
            description: tt('common.confirm_force_delete_message') || 'Hành động này sẽ xóa vĩnh viễn bản ghi và KHÔNG THỂ khôi phục. Bạn có chắc chắn không?',
            icon: <XCircle className="h-4 w-4" />,
            variant: 'destructive' as const,
            label: tt('common.force_delete') || 'Xóa vĩnh viễn',
            handler: () => dispatch(forceDeleteResourceRequest({ resource: resourceName!, id: row.id }))
        },
        delete: {
            title: 'Xác nhận xóa',
            description: 'Bạn có chắc chắn muốn xóa bản ghi này không? Hành động này có thể được khôi phục từ thùng rác.',
            icon: <Trash2 className="h-4 w-4" />,
            variant: 'destructive' as const,
            label: 'Xóa',
            handler: () => dispatch(deleteResourceRequest({ resource: resourceName!, id: row.id }))
        }
    };

    const handleConfirm = () => {
        if (confirmAction) {
            actions[confirmAction].handler();
            setConfirmAction(null);
        }
    };

    return <>
        <div className="flex items-center justify-end gap-1">
            {views?.actions?.duplicate !== false && (
                <Button
                    variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-primary hover:text-white"
                    onClick={() => setConfirmAction('duplicate')} title={actions.duplicate.label}
                >
                    {actions.duplicate.icon}
                </Button>
            )}

            {isTrash ? (
                <>
                    {views?.actions?.restore !== false && (
                        <Button
                            variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-green-100 hover:text-green-600"
                            onClick={() => setConfirmAction('restore')} title={actions.restore.label}
                        >
                            {actions.restore.icon}
                        </Button>
                    )}
                    {views?.actions?.['force-delete'] !== false && (
                        <Button
                            variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => setConfirmAction('forceDelete')} title={actions.forceDelete.label}
                        >
                            {actions.forceDelete.icon}
                        </Button>
                    )}
                </>
            ) : (
                <>
                    {views?.actions?.delete !== false && (
                        <Button
                            variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => setConfirmAction('delete')} title={actions.delete.label}
                        >
                            {actions.delete.icon}
                        </Button>
                    )}
                </>
            )}
        </div>

        <Dialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{confirmAction && actions[confirmAction].title}</DialogTitle>
                    <DialogDescription className={confirmAction === 'forceDelete' ? 'text-destructive' : ''}>
                        {confirmAction && actions[confirmAction].description}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setConfirmAction(null)}>
                        {tt('common.cancel') || 'Hủy'}
                    </Button>
                    <Button
                        variant={confirmAction ? actions[confirmAction].variant : 'default'}
                        onClick={handleConfirm}
                    >
                        {confirmAction && actions[confirmAction].label}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </>;
};

export default ToolbarDataTableRow;
