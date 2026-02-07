import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@core/components/ui/card";
import { Button } from "@core/components/ui/button";
import { Input } from "@core/components/ui/input";
import { Label } from "@core/components/ui/label";
import { Separator } from "@core/components/ui/separator";
import { Badge } from "@core/components/ui/badge";
import AppSidebarLayout from "@core/layouts/app-sidebar-layout";
import { usePage } from "@inertiajs/react";
import { User, Camera, CheckCircle2, KeyRound, Calendar, Clock } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@core/components/ui/avatar";
import { toast } from "sonner";
import { useState } from "react";
import { axios } from "@core/lib/axios";
import { route } from "@core/lib/route";
import { AxiosError } from "axios";
import { FormPages } from "@core/components/form/form-pages";
import { Field } from "@core/components/form/field";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@core/components/ui/dialog";

interface UserData extends Record<string, unknown> {
    id: number;
    name: string;
    email: string;
    phone?: string;
    avatar?: string;
    created_at?: string;
    updated_at?: string;
    email_verified_at?: string;
    phone_verified_at?: string;
    roles?: string[];
    social_accounts?: Array<{
        provider: string;
        email: string;
    }>;
}

interface PageProps {
    auth: {
        user: UserData;
    };
    item: UserData;
    [key: string]: unknown;
}

const GoogleIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z"/>
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
);

const FacebookIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M24 12.073c0-6.627-5.372-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="#1877F2" />
    </svg>
);

const Profiles = () => {
    const { props } = usePage<PageProps>();
    const { user } = props.auth;

    const [passwordData, setPasswordData] = useState({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const [passwordLoading, setPasswordLoading] = useState(false);
    const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);

    const handlePasswordChange = (field: keyof typeof passwordData, value: string) => {
        setPasswordData(prev => ({ ...prev, [field]: value }));
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.password !== passwordData.password_confirmation) {
            toast.error('Mật khẩu xác nhận không khớp!');
            return;
        }

        setPasswordLoading(true);
        try {
            await axios.put(route('admin.account.change-password.update'), passwordData);
            toast.success('Đổi mật khẩu thành công!');
            setPasswordData({
                current_password: '',
                password: '',
                password_confirmation: '',
            });
            setIsPasswordDialogOpen(false);
        } catch (err) {
            const axiosError = err as AxiosError<{ message: string }>;
            toast.error(axiosError.response?.data?.message || 'Có lỗi xảy ra khi đổi mật khẩu!');
        } finally {
            setPasswordLoading(false);
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const isConnected = (provider: string) => {
        return user.social_accounts?.some(acc => acc.provider === provider);
    };

    return (
        <AppSidebarLayout>
            <FormPages
                title="Thông tin cá nhân"
                defaultValues={user}
            >
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Profile Card (Left Column) */}
                    <div className="space-y-6 lg:col-span-1">
                        <Card>
                            <CardHeader>
                                <CardTitle>Ảnh đại diện</CardTitle>
                                <CardDescription>
                                    Cập nhật ảnh đại diện của bạn
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex flex-col items-center space-y-4">
                                    <Avatar className="h-32 w-32">
                                        <AvatarImage src={user.avatar} alt={user.name} />
                                        <AvatarFallback className="text-2xl">
                                            {getInitials(user.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <Button variant="outline" size="sm" className="w-full" type="button">
                                        <Camera className="mr-2 h-4 w-4" />
                                        Thay đổi ảnh
                                    </Button>
                                </div>
                                <Separator />
                                <div className="space-y-3 text-sm">
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground flex items-center">
                                            <User className="mr-2 h-4 w-4" />
                                            ID
                                        </span>
                                        <span className="font-mono">#{user.id}</span>
                                    </div>
                                    {user.created_at && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground flex items-center">
                                                <Calendar className="mr-2 h-4 w-4" />
                                                Ngày tạo
                                            </span>
                                            <span>{new Date(user.created_at).toLocaleDateString('vi-VN')}</span>
                                        </div>
                                    )}
                                    {user.updated_at && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground flex items-center">
                                                <Clock className="mr-2 h-4 w-4" />
                                                Ngày cập nhật
                                            </span>
                                            <span>{new Date(user.updated_at).toLocaleDateString('vi-VN')}</span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Social Accounts Card */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">Mạng xã hội</CardTitle>
                                <CardDescription>Liên kết tài khoản mạng xã hội</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center justify-between p-2 rounded-lg border bg-muted/30">
                                    <div className="flex items-center gap-3 text-sm">
                                        <GoogleIcon className="h-5 w-5" />
                                        <span>Google</span>
                                    </div>
                                    {isConnected('google') ? (
                                        <Badge variant="secondary" className="bg-green-100 text-green-700">Đã kết nối</Badge>
                                    ) : (
                                        <Button variant="ghost" size="sm" className="h-7 text-xs" type="button">Kết nối</Button>
                                    )}
                                </div>
                                <div className="flex items-center justify-between p-2 rounded-lg border bg-muted/30">
                                    <div className="flex items-center gap-3 text-sm">
                                        <FacebookIcon className="h-5 w-5" />
                                        <span>Facebook</span>
                                    </div>
                                    {isConnected('facebook') ? (
                                        <Badge variant="secondary" className="bg-green-100 text-green-700">Đã kết nối</Badge>
                                    ) : (
                                        <Button variant="ghost" size="sm" className="h-7 text-xs" type="button">Kết nối</Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column (Forms) */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Information Form */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Thông tin cá nhân</CardTitle>
                                <CardDescription>
                                    Cập nhật thông tin chi tiết của bạn
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-6">
                                    {/* Name - Use Field component for standardization */}
                                    <Field
                                        name="name"
                                        label="Họ và tên"
                                        required
                                        placeholder="Nhập họ và tên"
                                    />

                                    <div className="grid gap-4 md:grid-cols-2">
                                        {/* Email & Verification */}
                                        <div className="space-y-1">
                                            <div className="flex justify-between items-center px-1">
                                                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                                                {user.email_verified_at ? (
                                                    <Badge variant="secondary" className="h-5 bg-green-100 text-green-700 gap-1 text-[10px]">
                                                        <CheckCircle2 className="h-3 w-3" /> Đã xác thực
                                                    </Badge>
                                                ) : (
                                                    <button type="button" className="text-xs text-orange-600 hover:underline">Xác thực ngay</button>
                                                )}
                                            </div>
                                            <Field
                                                name="email"
                                                type="email"
                                                required
                                                placeholder="example@email.com"
                                            />
                                        </div>

                                        {/* Phone & Verification */}
                                        <div className="space-y-1">
                                            <div className="flex justify-between items-center px-1">
                                                <Label htmlFor="phone" className="text-sm font-medium">Số điện thoại</Label>
                                                {user.phone && (
                                                    user.phone_verified_at ? (
                                                        <Badge variant="secondary" className="h-5 bg-green-100 text-green-700 gap-1 text-[10px]">
                                                            <CheckCircle2 className="h-3 w-3" /> Đã xác thực
                                                        </Badge>
                                                    ) : (
                                                        <button type="button" className="text-xs text-orange-600 hover:underline">Xác thực ngay</button>
                                                    )
                                                )}
                                            </div>
                                            <Field
                                                name="phone"
                                                type="tel"
                                                placeholder="Nhập số điện thoại"
                                            />
                                        </div>
                                    </div>

                                    {/* Roles (read-only) */}
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">Vai trò</Label>
                                        <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-muted/20 min-h-[40px] items-center">
                                            {user.roles && (user.roles as string[]).length > 0 ? (
                                                (user.roles as string[]).map(role => (
                                                    <Badge key={role} variant="outline" className="capitalize">
                                                        {role}
                                                    </Badge>
                                                ))
                                            ) : (
                                                <span className="text-sm text-muted-foreground italic">Chưa có vai trò</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Password Change Section */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <KeyRound className="h-5 w-5" />
                                    Bảo mật & Mật khẩu
                                </CardTitle>
                                <CardDescription>Quản lý mật khẩu và thiết lập bảo mật cá nhân</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" className="w-full justify-start py-6 group hover:bg-primary hover:text-white">
                                            <KeyRound className="mr-2 h-5 w-5" />
                                            <div className="flex flex-col items-start">
                                                <span className="font-semibold">Đổi mật khẩu tài khoản</span>
                                                <span className="text-xs text-muted-foreground group-hover:text-white transition-colors">Thay đổi mật khẩu tài khoản của bạn bất cứ lúc nào</span>
                                            </div>
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-md">
                                        <DialogHeader>
                                            <DialogTitle>Đổi mật khẩu</DialogTitle>
                                            <DialogDescription>
                                                Nhập mật khẩu hiện tại và mật khẩu mới để cập nhật bảo mật cho tài khoản.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <form onSubmit={handleUpdatePassword} className="space-y-4 py-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="current_password">Mật khẩu hiện tại</Label>
                                                <div className="relative">
                                                    <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        id="current_password"
                                                        type="password"
                                                        value={passwordData.current_password}
                                                        onChange={e => handlePasswordChange('current_password', e.target.value)}
                                                        autoComplete="current-password"
                                                        className="pl-10"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="password">Mật khẩu mới</Label>
                                                <Input
                                                    id="password"
                                                    type="password"
                                                    value={passwordData.password}
                                                    onChange={e => handlePasswordChange('password', e.target.value)}
                                                    autoComplete="new-password"
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="password_confirmation">Xác nhận mật khẩu mới</Label>
                                                <Input
                                                    id="password_confirmation"
                                                    type="password"
                                                    value={passwordData.password_confirmation}
                                                    onChange={e => handlePasswordChange('password_confirmation', e.target.value)}
                                                    autoComplete="new-password"
                                                    required
                                                />
                                            </div>
                                            <DialogFooter className="pt-4">
                                                <Button type="button" variant="ghost" onClick={() => setIsPasswordDialogOpen(false)}>
                                                    Hủy bỏ
                                                </Button>
                                                <Button type="submit" variant="secondary" disabled={passwordLoading}>
                                                    {passwordLoading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
                                                </Button>
                                            </DialogFooter>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </FormPages>
        </AppSidebarLayout>
    );
};

export default Profiles;
