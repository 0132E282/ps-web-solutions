import { Card, CardHeader, CardTitle, CardContent, CardDescription} from "@core/components/ui/card";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@core/components/ui/table";
import { Checkbox } from "@core/components/ui/checkbox";
import { Input } from "@core/components/ui/input";
import { Button } from "@core/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@core/components/ui/dialog";
import AppLayout from "@core/layouts/app-layout";
import { usePage, router } from "@inertiajs/react";
import { useState, useMemo, useCallback } from "react";
import { Plus, Users, Edit, Search, Loader2, Trash2, Save } from "lucide-react";
import { Field } from "@core/components/form/field";
import { FormPages } from "@core/components/form";
import { route } from "@core/lib/route";
import type { FormData } from "@core/types/forms";

interface Permission {
    id: number;
    name: string;
    group: string;
    description: string;
}

interface ApplicationKey {
    id: number;
    name: string;
    permissions: Permission[];
    last_used_at?: string;
    user?: { id: number; name: string };
}

interface PageProps {
    permissions: Record<string, Permission[]>;
    applicationKeys: ApplicationKey[];
}

const formatPermissionName = (name: string): string => {
    return name.split('.').pop()?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || '';
};
interface RoleCardProps {
    role: ApplicationKey;
    isSelected: boolean;
    onSelect: (role: ApplicationKey) => void;
    onEdit: (role: ApplicationKey) => void;
}

const RoleCard = ({ role, isSelected, onSelect, onEdit }: RoleCardProps) => (
    <div
        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
            isSelected
                ? 'bg-primary/10 border-primary'
                : 'hover:bg-muted/50'
        }`}
        onClick={() => onSelect(role)}
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
            <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); onEdit(role); }}>
                <Edit className="h-4 w-4" />
            </Button>
        )}
    </div>
);

// Permission Table Component
interface PermissionTableProps {
    permissions: Record<string, Permission[]>;
    filteredPermissions: Record<string, Permission[]>;
    checkedPermissions: Set<number>;
    onPermissionToggle: (permissionId: number) => void;
    onGroupToggle: (groupPermissions: Permission[], checkAll: boolean) => void;
    isGroupFullyChecked: (groupName: string) => boolean;
}

const PermissionTable = ({
    permissions,
    filteredPermissions,
    checkedPermissions,
    onPermissionToggle,
    onGroupToggle,
    isGroupFullyChecked
}: PermissionTableProps) => (
    <div className="space-y-4">
        {Object.entries(filteredPermissions || {}).map(([groupName, groupPermissions]) => (
            <Card key={groupName}>
                <CardHeader>
                    <div className="flex items-center justify-between px-4">
                        <CardTitle className="text-lg">{groupName}</CardTitle>
                        <div className="flex items-center space-x-2">
                            <span className="text-sm text-muted-foreground">Chọn tất cả</span>
                            <Checkbox
                                checked={isGroupFullyChecked(groupName)}
                                onCheckedChange={() =>
                                    onGroupToggle(permissions[groupName] || groupPermissions, !isGroupFullyChecked(groupName))
                                }
                            />
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
                                <TableRow key={permission.id}>
                                    <TableCell className="font-mono text-sm">
                                        {permission.name}
                                    </TableCell>
                                    <TableCell>
                                        {formatPermissionName(permission.name)}
                                    </TableCell>
                                    <TableCell>
                                        {permission.description ?? ''}
                                    </TableCell>
                                    <TableCell>
                                        <Checkbox
                                            checked={checkedPermissions.has(permission.id)}
                                            onCheckedChange={() => onPermissionToggle(permission.id)}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        ))}
    </div>
);

// Role Dialog Component
interface RoleDialogProps {
    isOpen: boolean;
    editingRole: Role | null;
    onClose: () => void;
    onSave: (data: FormData) => void;
    isLoading?: boolean;
}

const RoleDialog = ({ isOpen, editingRole, onClose, onSave, isLoading = false }: RoleDialogProps) => {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {editingRole ? 'Cập nhật vai trò' : 'Thêm vai trò mới'}
                    </DialogTitle>
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
                                {editingRole ? <Save className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                                {editingRole ? 'Cập nhật vai trò' : 'Thêm vai trò mới'}
                            </Button>
                        </div>
                    </FormPages>
                </div>
            </DialogContent>
        </Dialog>
    );
};

const DeleteConfirmationDialog = ({
    isOpen,
    onClose,
    onConfirm,
    roleName
}: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    roleName: string;
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
);


const Index = () => {
    const { permissions, applicationKeys } = usePage().props as unknown as {
        permissions: Record<string, Permission[]>;
        applicationKeys: ApplicationKey[];
    };
    const [checkedPermissions, setCheckedPermissions] = useState<Set<number>>(new Set());
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedRole, setSelectedRole] = useState<ApplicationKey | null>(applicationKeys?.[0] || null);

    const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<ApplicationKey | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSavingPermissions, setIsSavingPermissions] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const syncPermissionsWithRole = useCallback((role: ApplicationKey | null) => {
        setCheckedPermissions(role ? new Set(role.permissions.map(p => p.id)) : new Set());
    }, []);

    const handleRoleSelect = useCallback((role: ApplicationKey) => {
        setSelectedRole(role);
        syncPermissionsWithRole(role);
    }, [syncPermissionsWithRole]);

    const saveRolePermissions = useCallback(async () => {
        if (!selectedRole) return;
        setIsSavingPermissions(true);
        try {
            await router.put(`/application-keys/${selectedRole.id}/permissions`, {
                permissions: Array.from(checkedPermissions)
            }, {
                onSuccess: () => {
                    // Refresh page to get updated data
                    router.reload();
                },
                onError: (errors) => {
                    console.error('Có lỗi xảy ra khi lưu quyền:', errors);
                }
            });
        } catch (error) {
            console.error('Có lỗi xảy ra khi lưu quyền:', error);
        } finally {
            setIsSavingPermissions(false);
        }
    }, [selectedRole, checkedPermissions]);


    const filteredPermissions = useMemo(() => {
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
    }, [permissions, searchTerm]);

    const openRoleDialog = useCallback((role: ApplicationKey | null = null) => {
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
            if (editingRole) {
                await router.put(route('admin.application-keys.update', { id: editingRole.id }), roleData, {
                    onSuccess: closeRoleDialog,
                    onError: (errors) => {
                        console.error('Có lỗi xảy ra khi cập nhật application key:', errors);
                    }
                });
            } else {
                await router.post(route('admin.application-keys.store'), roleData, {
                    onSuccess: closeRoleDialog,
                    onError: (errors) => {
                        console.error('Có lỗi xảy ra khi tạo application key:', errors);
                    }
                });
            }
        } finally {
            setIsLoading(false);
        }
    }, [editingRole, closeRoleDialog]);

    const confirmDeleteRole = useCallback(async () => {
        if (!selectedRole) return;
        await router.delete(route('admin.application-keys.destroy', { id: selectedRole.id }), {
            onSuccess: () => {
                setSelectedRole(null);
                setIsDeleteDialogOpen(false);
            },
            onError: (error) => {
                console.error('Có lỗi xảy ra khi xóa vai trò:', error);
            }
        });
    }, [selectedRole]);

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
                        <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => openRoleDialog()}>
                                <Plus className="h-4 w-4 mr-1" />
                                Thêm mới
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        {applicationKeys.map(role => (
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
                <div className="flex-1 w-full space-y-4  overflow-y-auto gap-4">
                    <div className="flex items-center justify-between">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input
                                type="text"
                                placeholder="Tìm kiếm quyền..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
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
                            onClick={() => setIsDeleteDialogOpen(true)}
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
                        onClose={() => setIsDeleteDialogOpen(false)}
                        onConfirm={confirmDeleteRole}
                        roleName={selectedRole?.name || ''}
                    />
                </div>
            </div>
        </AppLayout>
    );
};

export default Index;
