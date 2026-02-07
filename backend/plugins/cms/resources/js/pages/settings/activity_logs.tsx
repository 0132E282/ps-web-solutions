import InputDateRange from "@core/components/form/input/InputDateRange";
import LaravelPagination from "@core/components/pagination";
import { Badge } from "@core/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@core/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@core/components/ui/dialog";
import { Input } from "@core/components/ui/input";
import { Label } from "@core/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@core/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@core/components/ui/table";
import AppLayout from "@core/layouts/app-layout";
import { route } from "@core/lib/route";
import { router, usePage } from "@inertiajs/react";
import { format } from "date-fns";
import { Activity, Edit, Eye, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

interface Causer {
    id: number;
    name: string;
    email?: string;
}

interface ActivityLog {
    id: number;
    log_name: string;
    description: string;
    subject_type: string;
    subject_id: number;
    event: string;
    causer?: Causer;
    properties: {
        attributes?: Record<string, unknown>;
        old?: Record<string, unknown>;
        [key: string]: unknown;
    };
    created_at: string;
}

interface FilterProps {
    search?: string;
    event?: string;
    date_from?: string;
    date_to?: string;
}

interface ActivityLogsProps {
    activities: {
        data: ActivityLog[];
        links: {
            url: string | null;
            label: string;
            active: boolean;
        }[];
        meta?: {
            current_page: number;
            last_page: number;
            per_page: number;
            total: number;
        };
    };
    filters?: FilterProps;
}

const ActivityLogs = () => {
    const { activities, filters } = usePage().props as unknown as ActivityLogsProps;

    // Initialize state from URL props
    const [searchTerm, setSearchTerm] = useState(filters?.search || "");
    const [eventFilter, setEventFilter] = useState(filters?.event || "all");
    const [dateFrom, setDateFrom] = useState(filters?.date_from || "");
    const [dateTo, setDateTo] = useState(filters?.date_to || "");
    const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);

    // Debounce search and filter updates
    useEffect(() => {
        const timer = setTimeout(() => {
            router.get(
                route('admin.settings.activity-logs.index'),
                {
                    search: searchTerm,
                    event: eventFilter === 'all' ? null : eventFilter,
                    date_from: dateFrom,
                    date_to: dateTo
                },
                { preserveState: true, preserveScroll: true, replace: true }
            );
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm, eventFilter, dateFrom, dateTo]);

    const getEventColor = (event: string) => {
        switch (event) {
            case 'created': return 'bg-green-100 text-green-800 border-green-200';
            case 'updated': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'deleted': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getEventIcon = (event: string) => {
        switch (event) {
            case 'created': return <Plus className="h-4 w-4" />;
            case 'updated': return <Edit className="h-4 w-4" />;
            case 'deleted': return <Trash2 className="h-4 w-4" />;
            default: return <Activity className="h-4 w-4" />;
        }
    };

    return (
        <AppLayout>
            <div className="flex flex-col gap-4">
                <Card>
                    <CardHeader>
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            <div>
                                <CardTitle>Activity Logs</CardTitle>
                                <CardDescription>Theo dõi hoạt động của hệ thống</CardDescription>
                            </div>
                        </div>

                        {/* Filters Section */}
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Tìm kiếm user, sự kiện..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-8"
                                />
                            </div>

                            <Select value={eventFilter} onValueChange={(value: string) => setEventFilter(value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn sự kiện" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tất cả sự kiện</SelectItem>
                                    <SelectItem value="created">Created</SelectItem>
                                    <SelectItem value="updated">Updated</SelectItem>
                                    <SelectItem value="deleted">Deleted</SelectItem>
                                </SelectContent>
                            </Select>

                            <div className="col-span-1 md:col-span-2">
                                <InputDateRange
                                    name="date_range"
                                    value={{ from: dateFrom, to: dateTo }}
                                    onChange={(value: { from: string; to: string }) => {
                                        setDateFrom(value.from || "");
                                        setDateTo(value.to || "");
                                    }}
                                    placeholder="Chọn khoảng thời gian"
                                    className="w-full"
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Action</TableHead>
                                    <TableHead>Subject</TableHead>
                                    <TableHead>Time</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {activities.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                            Không có nhật ký hoạt động nào.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    activities.data.map((log) => (
                                        <TableRow key={log.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedLog(log)}>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{log.causer?.name || 'System'}</span>
                                                    <span className="text-xs text-muted-foreground">{log.causer?.email}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={`flex w-fit items-center gap-1 ${getEventColor(log.event)}`}>
                                                    {getEventIcon(log.event)}
                                                    {log.event.toUpperCase()}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium">{log.subject_type?.split('\\').pop()}</span>
                                                    <span className="text-xs text-muted-foreground">ID: {log.subject_id}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss')}
                                            </TableCell>
                                            <TableCell>
                                                <Eye className="h-4 w-4 text-muted-foreground" />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>

                        <div className="mt-4">
                            <LaravelPagination links={activities.links} />
                        </div>
                    </CardContent>
                </Card>

                {/* Log Details Dialog */}
                <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
                    <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                Activity Details
                                {selectedLog && (
                                    <Badge variant="outline" className={getEventColor(selectedLog.event)}>
                                        {selectedLog.event.toUpperCase()}
                                    </Badge>
                                )}
                            </DialogTitle>
                            <DialogDescription>
                                Chi tiết thay đổi được ghi lại vào lúc {selectedLog && format(new Date(selectedLog.created_at), 'dd/MM/yyyy HH:mm:ss')}
                            </DialogDescription>
                        </DialogHeader>
                        {selectedLog && (
                            <div className="mt-4 space-y-6">
                                <div className="grid grid-cols-2 gap-6 p-4 bg-muted/30 rounded-lg">
                                    <div>
                                        <Label className="text-xs text-muted-foreground uppercase">User</Label>
                                        <div className="font-medium mt-1">{selectedLog.causer?.name || 'System'}</div>
                                        <div className="text-sm text-muted-foreground">{selectedLog.causer?.email}</div>
                                    </div>
                                    <div>
                                        <Label className="text-xs text-muted-foreground uppercase">Subject</Label>
                                        <div className="font-medium mt-1">{selectedLog.subject_type}</div>
                                        <div className="text-sm text-muted-foreground">ID: {selectedLog.subject_id}</div>
                                    </div>
                                </div>

                                {/* Diff View */}
                                <div className="space-y-4">
                                    {selectedLog.event === 'updated' && selectedLog.properties?.old ? (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <h4 className="text-sm font-medium mb-2 text-red-600">Old Values</h4>
                                                <div className="bg-red-50 border border-red-100 p-4 rounded-md overflow-x-auto">
                                                    <pre className="text-xs font-mono whitespace-pre-wrap text-red-800">
                                                        {JSON.stringify(selectedLog.properties.old, null, 2)}
                                                    </pre>
                                                </div>
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-medium mb-2 text-green-600">New Values</h4>
                                                <div className="bg-green-50 border border-green-100 p-4 rounded-md overflow-x-auto">
                                                    <pre className="text-xs font-mono whitespace-pre-wrap text-green-800">
                                                        {JSON.stringify(selectedLog.properties.attributes, null, 2)}
                                                    </pre>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <h4 className="text-sm font-medium mb-2">Properties</h4>
                                            <div className="bg-muted p-4 rounded-md overflow-x-auto">
                                                <pre className="text-xs font-mono whitespace-pre-wrap">
                                                    {JSON.stringify(selectedLog.properties, null, 2)}
                                                </pre>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
};

export default ActivityLogs;
