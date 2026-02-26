import { memo, useState, useMemo, useCallback } from "react";
import { usePage, router } from "@inertiajs/react";
import { Plus, Users, Edit, Search, Loader2, Trash2, Save } from "lucide-react";

import { FormPages } from "@core/components/form";
import { Field } from "@core/components/form/field";
import { Button } from "@core/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@core/components/ui/card";
import { Checkbox } from "@core/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@core/components/ui/dialog";
import { Input } from "@core/components/ui/input";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@core/components/ui/table";
import AppLayout from "@core/layouts/app-layout";
import { route } from "@core/lib/route";

import type { FormData } from "@core/types/forms";
import type { MouseEvent } from "react";

// ============================================================================
// Types
// ============================================================================

interface Permission {
    id: number;
    name: string;
    group: string;
    description: string;
}

interface Role {
    id: number;
    name: string;
    permissions: Permission[];
}

interface PageProps {
    permissions: Record<string, Permission[]>;
    roles: Role[];
    [key: string]: unknown;
}

interface RoleCardProps {
    role: Role;
    isSelected: boolean;
    onSelect: (role: Role) => void;
    onEdit: (role: Role) => void;
}

interface PermissionTableProps {
    permissions: Record<string, Permission[]>;
    filteredPermissions: Record<string, Permission[]>;
    checkedPermissions: Set<number>;
    onPermissionToggle: (permissionId: number) => void;
    onGroupToggle: (groupPermissions: Permission[], checkAll: boolean) => void;
    isGroupFullyChecked: (groupName: string) => boolean;
}

interface RoleDialogProps {
    isOpen: boolean;
    editingRole: Role | null;
    onClose: () => void;
    onSave: (data: FormData) => void;
    isLoading?: boolean;
}

interface DeleteConfirmationDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    roleName: string;
}

// ============================================================================
// Utilities
// ============================================================================

const formatPermissionName = (name: string): string => {
    return name.split('.').pop()?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || '';
};

const filterPermissions = (
    permissions: Record<string, Permission[]>,
    searchTerm: string
): Record<string, Permission[]> => {
    if (!searchTerm.trim()) return permissions;

    const searchLower = searchTerm.toLowerCase();
    return Object.entries(permissions).reduce((acc, [groupName, groupPermissions]) => {
        const filteredGroup = groupPermissions.filter((permission) => {
            const nameLower = permission.name.toLowerCase();
            const formattedName = formatPermissionName(permission.name).toLowerCase();
            return nameLower.includes(searchLower) || formattedName.includes(searchLower);
        });

        if (filteredGroup.length > 0) {
            acc[groupName] = filteredGroup;
        }

        return acc;
    }, {} as Record<string, Permission[]>);
};

// ============================================================================
// Components
// ============================================================================

const RoleCard = memo<RoleCardProps>(({ role, isSelected, onSelect, onEdit }) => {
    const handleClick = useCallback(() => {
        onSelect(role);
    }, [onSelect, role]);

    const handleEdit = useCallback((e: MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        onEdit(role);
    }, [onEdit, role]);

    return (
        <div
            className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                isSelected ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'
            }`}
            onClick={handleClick}
        >
            <div className="flex items-center gap-3">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                    <span className="font-medium">{role.name}</span>
                    <span className="text-sm ml-2 text-muted-foreground">
                        {role.permissions.length} quyền
                    </span>
                </div>
            </div>
            {isSelected && (
                <Button size="sm" variant="ghost" onClick={handleEdit}>
                    <Edit className="h-4 w-4" />
                </Button>
            )}
        </div>
    );
});

RoleCard.displayName = 'RoleCard';

const PermissionRow = memo<{
    permission: Permission;
    isChecked: boolean;
    onToggle: (id: number) => void;
}>(({ permission, isChecked, onToggle }) => {
    const handleToggle = useCallback(() => {
        onToggle(permission.id);
    }, [onToggle, permission.id]);

    return (
        <TableRow>
            <TableCell className="font-mono text-sm">{permission.name}</TableCell>
            <TableCell>{formatPermissionName(permission.name)}</TableCell>
            <TableCell>{permission.description ?? ''}</TableCell>
            <TableCell>
                <Checkbox checked={isChecked} onCheckedChange={handleToggle} />
            </TableCell>
        </TableRow>
    );
});

PermissionRow.displayName = 'PermissionRow';

const PermissionGroup = memo<{
    groupName: string;
    groupPermissions: Permission[];
    originalGroupPermissions: Permission[];
    checkedPermissions: Set<number>;
    onPermissionToggle: (id: number) => void;
    onGroupToggle: (permissions: Permission[], checkAll: boolean) => void;
}>(({ groupName, groupPermissions, originalGroupPermissions, checkedPermissions, onPermissionToggle, onGroupToggle }) => {
    const isFullyChecked = useMemo(() => {
        return originalGroupPermissions.length > 0 &&
               originalGroupPermissions.every(p => checkedPermissions.has(p.id));
    }, [originalGroupPermissions, checkedPermissions]);

    const handleGroupToggle = useCallback(() => {
        onGroupToggle(originalGroupPermissions, !isFullyChecked);
    }, [onGroupToggle, originalGroupPermissions, isFullyChecked]);

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between px-4">
                    <CardTitle className="text-lg">{groupName}</CardTitle>
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-muted-foreground">Chọn tất cả</span>
                        <Checkbox checked={isFullyChecked} onCheckedChange={handleGroupToggle} />
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Code</TableHead>
                            <TableHead>Tên</TableHead>
                            <TableHead>Mô tả</TableHead>
                            <TableHead className="w-[50px]">Chọn</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {groupPermissions.map((permission) => (
                            <PermissionRow
                                key={permission.id}
                                permission={permission}
                                isChecked={checkedPermissions.has(permission.id)}
                                onToggle={onPermissionToggle}
                            />
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
});

PermissionGroup.displayName = 'PermissionGroup';

const PermissionTable = memo<PermissionTableProps>(({
    permissions,
    filteredPermissions,
    checkedPermissions,
    onPermissionToggle,
    onGroupToggle,
}) => (
    <div className="space-y-4">
        {Object.entries(filteredPermissions).map(([groupName, groupPermissions]) => (
            <PermissionGroup
                key={groupName}
                groupName={groupName}
                groupPermissions={groupPermissions}
                originalGroupPermissions={permissions[groupName] || groupPermissions}
                checkedPermissions={checkedPermissions}
                onPermissionToggle={onPermissionToggle}
                onGroupToggle={onGroupToggle}
            />
        ))}
    </div>
));

PermissionTable.displayName = 'PermissionTable';

const RoleDialog = memo<RoleDialogProps>(({ isOpen, editingRole, onClose, onSave, isLoading = false }) => {
    const dialogTitle = editingRole ? 'Cập nhật vai trò' : 'Thêm vai trò mới';
    const buttonText = editingRole ? 'Cập nhật vai trò' : 'Thêm vai trò mới';
    const ButtonIcon = editingRole ? Save : Plus;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{dialogTitle}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <FormPages
                        onSubmit={onSave}
                        showHeader={false}
                        defaultValues={{ name: editingRole?.name || "" }}
                        className="space-y-4"
                    >
                        <Field
                            name="name"
                            label="Tên vai trò"
                            placeholder="Nhập tên vai trò..."
                            type="text"
                        />
                        <div className="flex justify-end space-x-2 mt-4">
                            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                                Hủy
                            </Button>
                            <Button type="submit" className="cursor-pointer" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                <ButtonIcon className="h-4 w-4 mr-2" />
                                {buttonText}
                            </Button>
                        </div>
                    </FormPages>
                </div>
            </DialogContent>
        </Dialog>
    );
});

RoleDialog.displayName = 'RoleDialog';

const DeleteConfirmationDialog = memo<DeleteConfirmationDialogProps>(({
    isOpen,
    onClose,
    onConfirm,
    roleName
}) => (
    <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Xác nhận xóa vai trò</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                    Bạn có chắc chắn muốn xóa vai trò <strong>"{roleName}"</strong> không?
                </p>
                <p className="text-sm text-muted-foreground">
                    Hành động này không thể hoàn tác và sẽ xóa tất cả quyền liên quan đến vai trò này.
                </p>
                <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={onClose}>
                        Hủy
                    </Button>
                    <Button variant="destructive" onClick={onConfirm}>
                        Xóa vai trò
                    </Button>
                </div>
            </div>
        </DialogContent>
    </Dialog>
));

DeleteConfirmationDialog.displayName = 'DeleteConfirmationDialog';

// ============================================================================
// Main Component
// ============================================================================

const Index = () => {
    const { permissions, roles } = usePage<PageProps>().props;

    // State
    const [checkedPermissions, setCheckedPermissions] = useState<Set<number>>(new Set());
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedRole, setSelectedRole] = useState<Role | null>(roles[0] || null);
    const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSavingPermissions, setIsSavingPermissions] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    // Derived state
    const filteredPermissions = useMemo(() =>
        filterPermissions(permissions, searchTerm),
        [permissions, searchTerm]
    );

    // Callbacks
    const syncPermissionsWithRole = useCallback((role: Role | null) => {
        setCheckedPermissions(role ? new Set(role.permissions.map(p => p.id)) : new Set());
    }, []);

    const handleRoleSelect = useCallback((role: Role) => {
        setSelectedRole(role);
        syncPermissionsWithRole(role);
    }, [syncPermissionsWithRole]);

    const handlePermissionToggle = useCallback((permissionId: number) => {
        setCheckedPermissions(prev => {
            const newChecked = new Set(prev);
            if (newChecked.has(permissionId)) {
                newChecked.delete(permissionId);
            } else {
                newChecked.add(permissionId);
            }
            return newChecked;
        });
    }, []);

    const handleGroupToggle = useCallback((groupPermissions: Permission[], checkAll: boolean) => {
        setCheckedPermissions(prev => {
            const newChecked = new Set(prev);
            groupPermissions.forEach(permission => {
                if (checkAll) {
                    newChecked.add(permission.id);
                } else {
                    newChecked.delete(permission.id);
                }
            });
            return newChecked;
        });
    }, []);

    const isGroupFullyChecked = useCallback((groupName: string) => {
        const originalGroupPermissions = permissions[groupName] || [];
        return originalGroupPermissions.length > 0 &&
               originalGroupPermissions.every(p => checkedPermissions.has(p.id));
    }, [permissions, checkedPermissions]);

    const saveRolePermissions = useCallback(async () => {
        if (!selectedRole) return;

        setIsSavingPermissions(true);
        try {
            await router.put(route('admin.settings.roles.permissions', { id: selectedRole.id }), {
                permissions: Array.from(checkedPermissions)
            }, {
                onSuccess: () => router.reload(),
                onError: (errors) => console.error('Có lỗi xảy ra khi lưu quyền:', errors)
            });
        } catch (error) {
            console.error('Có lỗi xảy ra khi lưu quyền:', error);
        } finally {
            setIsSavingPermissions(false);
        }
    }, [selectedRole, checkedPermissions]);

    const openRoleDialog = useCallback((role: Role | null = null) => {
        setEditingRole(role);
        setIsRoleDialogOpen(true);
    }, []);

    const closeRoleDialog = useCallback(() => {
        setIsRoleDialogOpen(false);
        setEditingRole(null);
    }, []);

    const saveRole = useCallback(async (data: FormData) => {
        setIsLoading(true);
        try {
            const roleData = { name: data.name as string };
            const routeName = editingRole ? 'admin.settings.roles.update' : 'admin.settings.roles.store';
            const method = editingRole ? 'put' : 'post';
            const routeParams = editingRole ? { id: editingRole.id } : undefined;

            await router[method](route(routeName, routeParams), roleData, {
                onSuccess: closeRoleDialog,
                onError: (errors) => console.error('Có lỗi xảy ra khi lưu vai trò:', errors)
            });
        } finally {
            setIsLoading(false);
        }
    }, [editingRole, closeRoleDialog]);

    const confirmDeleteRole = useCallback(async () => {
        if (!selectedRole) return;

        await router.delete(route('admin.settings.roles.delete', { id: selectedRole.id }), {
            onSuccess: () => {
                setSelectedRole(null);
                setIsDeleteDialogOpen(false);
            },
            onError: (error) => console.error('Có lỗi xảy ra khi xóa vai trò:', error)
        });
    }, [selectedRole]);

    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    }, []);

    const openDeleteDialog = useCallback(() => {
        setIsDeleteDialogOpen(true);
    }, []);

    const closeDeleteDialog = useCallback(() => {
        setIsDeleteDialogOpen(false);
    }, []);

    return (
        <AppLayout>
            <div className="flex gap-4">
                <Card className="max-w-[400px] w-full">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Vai trò</CardTitle>
                                <CardDescription>Quản lý vai trò của người dùng</CardDescription>
                            </div>
                            <Button size="sm" variant="outline" onClick={() => openRoleDialog()}>
                                <Plus className="h-4 w-4 mr-1" />
                                Thêm mới
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            {roles?.map(role => (
                                <RoleCard
                                    key={role.id}
                                    role={role}
                                    isSelected={selectedRole?.id === role.id}
                                    onSelect={handleRoleSelect}
                                    onEdit={openRoleDialog}
                                />
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <div className="flex-1 w-full space-y-4 overflow-y-auto gap-4">
                    <div className="flex items-center justify-between">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input
                                type="text"
                                placeholder="Tìm kiếm quyền..."
                                value={searchTerm}
                                onChange={handleSearchChange}
                                className="pl-10"
                            />
                        </div>
                        <Button
                            onClick={saveRolePermissions}
                            disabled={!selectedRole || isSavingPermissions}
                            className="ml-4 cursor-pointer"
                        >
                            <Save className="h-4 w-4 mr-2" />
                            {isSavingPermissions && <Loader2 className="h-4 w-4 animate-spin" />}
                            Lưu quyền
                        </Button>
                        <Button
                            onClick={openDeleteDialog}
                            disabled={!selectedRole || isSavingPermissions}
                            className="ml-4 bg-red-500 hover:bg-red-600 cursor-pointer text-white"
                        >
                            <Trash2 className="h-4 w-4" />
                            Xóa vai trò
                        </Button>
                    </div>

                    <div className="space-y-4 max-h-[calc(100vh-150px)] overflow-y-auto">
                        <PermissionTable
                            permissions={permissions}
                            filteredPermissions={filteredPermissions}
                            checkedPermissions={checkedPermissions}
                            onPermissionToggle={handlePermissionToggle}
                            onGroupToggle={handleGroupToggle}
                            isGroupFullyChecked={isGroupFullyChecked}
                        />
                    </div>

                    <RoleDialog
                        isOpen={isRoleDialogOpen}
                        editingRole={editingRole}
                        onClose={closeRoleDialog}
                        onSave={saveRole}
                        isLoading={isLoading}
                    />

                    <DeleteConfirmationDialog
                        isOpen={isDeleteDialogOpen}
                        onClose={closeDeleteDialog}
                        onConfirm={confirmDeleteRole}
                        roleName={selectedRole?.name || ''}
                    />
                </div>
            </div>
        </AppLayout>
    );
};

export default Index;
