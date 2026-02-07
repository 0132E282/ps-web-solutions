import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@core/components/ui/card";
import { Badge } from "@core/components/ui/badge";
import { Button } from "@core/components/ui/button";
import AppSidebarLayout from "@core/layouts/app-sidebar-layout";


import { Bell, CheckCircle2, Clock, Trash2, MailOpen, Mail, AlertTriangle, AlertCircle, Info } from "lucide-react";
import { router } from "@inertiajs/react";
import { toast } from "sonner";
import { cn } from "@core/lib/utils";
import { route } from "@core/lib/route";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

interface Notification {
    id: string;
    data: {
        title: string;
        message: string;
        type?: 'info' | 'success' | 'warning' | 'error';
    };
    read_at: string | null;
    created_at: string;
}

interface Props {
    notifications: {
        data: Notification[];
        links: {
            url: string | null;
            label: string;
            active: boolean;
        }[];
        meta: {
            current_page: number;
            from: number;
            last_page: number;
            links: {
                url: string | null;
                label: string;
                active: boolean;
            }[];
            path: string;
            per_page: number;
            to: number;
            total: number;
        };

    };
}


const NotificationsPage = ({ notifications }: Props) => {
    const notificationList = notifications.data;

    const markAsRead = (id: string) => {
        router.post(route('admin.notifications.read', { id }), {}, {
            preserveScroll: true,
            onSuccess: () => toast.success('Đã đánh dấu là đã đọc'),
        });
    };

    const deleteNotification = (id: string) => {
        if (!confirm('Bạn có chắc muốn xóa thông báo này?')) return;
        router.delete(route('admin.notifications.destroy', { id }), {
            preserveScroll: true,
            onSuccess: () => toast.success('Đã xóa thông báo'),
        });
    };

    const markAllAsRead = () => {
        router.post(route('admin.notifications.read-all'), {}, {
            preserveScroll: true,
            onSuccess: () => toast.success('Đã đánh dấu tất cả là đã đọc'),
        });
    };

    const deleteAll = () => {
        if (!confirm('Bạn có chắc muốn xóa tất cả thông báo?')) return;
        router.delete(route('admin.notifications.destroy-all'), {
            preserveScroll: true,
            onSuccess: () => toast.success('Đã xóa tất cả thông báo'),
        });
    };

    const getTypeIcon = (type?: string) => {
        switch (type) {
            case 'success': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
            case 'warning': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
            case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
            case 'info': return <Info className="h-4 w-4 text-blue-500" />;
            default: return <Bell className="h-4 w-4 text-primary/60" />;
        }
    };

    const unreadCount = notificationList.filter(n => !n.read_at).length;

    return (
        <AppSidebarLayout>
            <div className="space-y-4 max-w-4xl mx-auto py-2 px-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Thông báo</h1>
                        <p className="text-muted-foreground text-xs md:text-sm">
                            Quản lý các thông báo từ hệ thống và hoạt động của bạn
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs px-3"
                            onClick={markAllAsRead}
                            disabled={notificationList.length === 0 || unreadCount === 0}
                        >
                            Đánh dấu tất cả là đã đọc
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs px-3 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={deleteAll}
                            disabled={notificationList.length === 0}
                        >
                            Xóa tất cả
                        </Button>
                    </div>
                </div>

                <Card className="border-none shadow-sm bg-card/40 backdrop-blur-md">
                    <CardHeader className="py-3 px-4 border-b flex flex-row items-center justify-between space-y-0">
                        <div className="space-y-0.5">
                            <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                Danh sách thông báo
                                {unreadCount > 0 && (
                                    <Badge variant="default" className="h-5 px-1.5 text-[10px] font-bold">
                                        {unreadCount}
                                    </Badge>
                                )}
                            </CardTitle>
                        </div>
                        <CardDescription className="hidden sm:block text-xs uppercase tracking-wider font-medium opacity-60">
                            Cập nhật mới nhất
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        {notificationList.length > 0 ? (
                            <div className="divide-y divide-border/40">
                                {notificationList.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={cn(
                                            "flex items-start gap-3 p-3.5 transition-all duration-200 hover:bg-muted/30 relative group",
                                            !notification.read_at && "bg-primary/[0.02]"
                                        )}
                                    >
                                        {!notification.read_at && (
                                            <div className="absolute left-0 top-1 bottom-1 w-0.5 bg-primary rounded-r-full" />
                                        )}
                                        <div className="mt-0.5 shrink-0 p-1.5 rounded-lg bg-background shadow-[0_1px_3px_rgba(0,0,0,0.05)] ring-1 ring-border/40 group-hover:ring-primary/20 transition-all">
                                            {getTypeIcon(notification.data.type)}
                                        </div>
                                        <div className="flex-1 min-w-0 space-y-1">
                                            <div className="flex items-center justify-between gap-3">
                                                <h3 className={cn(
                                                    "font-medium text-sm transition-colors truncate",
                                                    !notification.read_at ? "text-foreground" : "text-muted-foreground"
                                                )}>
                                                    {notification.data.title}
                                                </h3>
                                                <span className="text-[10px] text-muted-foreground flex items-center shrink-0 bg-muted/30 px-1.5 py-0.5 rounded-full font-medium">
                                                    <Clock className="mr-1 h-2.5 w-2.5 opacity-60" />
                                                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: vi })}
                                                </span>
                                            </div>
                                            <p className={cn(
                                                "text-xs leading-normal max-w-2xl transition-opacity",
                                                !notification.read_at ? "text-foreground/70" : "text-muted-foreground/60"
                                            )}>
                                                {notification.data.message}
                                            </p>
                                            <div className="flex items-center gap-2 pt-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300">
                                                {!notification.read_at ? (
                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        className="h-7 text-[10px] gap-1 px-2 font-medium"
                                                        onClick={() => markAsRead(notification.id)}
                                                    >
                                                        <MailOpen className="h-3 w-3" />
                                                        Đánh dấu đã đọc
                                                    </Button>
                                                ) : (
                                                    <div className="text-[10px] text-muted-foreground/50 flex items-center px-2 h-7 font-medium">
                                                        <Mail className="h-3 w-3 mr-1 opacity-40" />
                                                        Đã đọc
                                                    </div>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 text-[10px] gap-1 px-2 text-destructive/80 hover:text-destructive hover:bg-destructive/10 font-medium"
                                                    onClick={() => deleteNotification(notification.id)}
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                    Xóa
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-16 flex flex-col items-center justify-center text-center px-6">
                                <div className="p-3.5 rounded-2xl bg-muted/20 mb-4 ring-1 ring-border/10">
                                    <Bell className="h-10 w-10 text-muted-foreground/30" />
                                </div>
                                <h3 className="text-lg font-semibold text-foreground/70">Không có thông báo nào</h3>
                                <p className="text-xs text-muted-foreground max-w-[200px] mt-1.5 leading-relaxed">
                                    Tất cả các thông báo mới từ hệ thống sẽ xuất hiện tại đây.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppSidebarLayout>
    );
};

export default NotificationsPage;

