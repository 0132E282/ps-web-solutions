import { Field, FormPages } from '@core/components/form';
import { Button } from '@core/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@core/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@core/components/ui/tabs';
import AppLayout from '@core/layouts/app-layout';
import { route } from '@core/lib/route';
import { cn } from '@core/lib/utils';
import { router, usePage } from '@inertiajs/react';
import { Globe, Mail, Clock, Bell, type LucideIcon } from 'lucide-react';
import { useCallback, useMemo, type ReactNode } from 'react';

interface WebsiteData {
    name?: string;
    description?: string;
    domain?: string;
    logo?: string;
    favicon?: string;
    featured_image?: string;
    smtp_host?: string;
    smtp_port?: string;
    smtp_username?: string;
    smtp_password?: string;
    smtp_encryption?: string;
    smtp_from_email?: string;
    smtp_from_name?: string;
    timezone?: string;
    notification_emails?: string;
    super_admin_email?: string;
    super_admin_name?: string;
    receive_notifications?: boolean;
}

interface PageProps {
    website?: WebsiteData;
    timezones?: string[];
    [key: string]: unknown;
}

const DEFAULT_VALUES: WebsiteData = {
    name: '',
    description: '',
    domain: '',
    logo: '',
    favicon: '',
    featured_image: '',
    smtp_host: '',
    smtp_port: '587',
    smtp_username: '',
    smtp_password: '',
    smtp_encryption: 'tls',
    smtp_from_email: '',
    smtp_from_name: '',
    timezone: 'Asia/Ho_Chi_Minh',
    notification_emails: '',
    super_admin_email: '',
    super_admin_name: '',
    receive_notifications: true,
};

const COMMON_TIMEZONES = [
    'Asia/Ho_Chi_Minh',
    'Asia/Bangkok',
    'Asia/Singapore',
    'Asia/Tokyo',
    'Asia/Seoul',
    'Asia/Shanghai',
    'UTC',
    'America/New_York',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
];

interface MenuItem {
    id: string;
    label: string;
    icon: LucideIcon;
}

const MENU_ITEMS: MenuItem[] = [
    { id: 'general', label: 'Thông tin chung', icon: Globe },
    { id: 'smtp', label: 'SMTP', icon: Mail },
    { id: 'timezone', label: 'Múi giờ', icon: Clock },
    { id: 'notifications', label: 'Thông báo', icon: Bell },
];

// Section Card Component
interface SectionCardProps {
    id: string;
    icon: LucideIcon;
    title: string;
    description: string;
    children: ReactNode;
}

const SectionCard = ({ id, icon: Icon, title, description, children }: SectionCardProps) => (
    <Card id={id} className="border-none shadow-none">
        <CardHeader className="px-0 pt-0">
            <div className="flex items-center gap-2">
                <Icon className="h-5 w-5 text-primary" />
                <CardTitle>{title}</CardTitle>
            </div>
            <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="px-0 space-y-4">{children}</CardContent>
    </Card>
);

const Website = () => {
    const { props } = usePage<PageProps>();
    const { website, timezones = COMMON_TIMEZONES } = props;

    // Memoized default values
    const defaultValues = useMemo(
        () => (website || DEFAULT_VALUES) as never,
        [website]
    );

    // Memoized timezone options
    const timezoneOptions = useMemo(
        () => timezones.map((tz) => ({ value: tz, label: tz })),
        [timezones]
    );

    // Handle form submission
    const handleSubmit = useCallback((data: Record<string, unknown>) => {
        router.post(route('admin.settings.show', { key: 'website' }), data as never);
    }, []);

    return (
        <AppLayout>
            <div className="mb-6">
                <h1 className="text-3xl font-bold">Cấu hình Website</h1>
                <p className="text-muted-foreground">
                    Quản lý thông tin website, email, múi giờ và tài khoản quản trị
                </p>
            </div>

            <FormPages
                onSubmit={handleSubmit}
                showHeader={false}
                defaultValues={defaultValues}
            >
                <Tabs defaultValue="general" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start" orientation="vertical">
                    <aside className="lg:col-span-3">
                        <div className="sticky top-[172px]">
                            <TabsList className="flex flex-col h-auto bg-transparent p-0 space-y-1 w-full">
                                {MENU_ITEMS.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <TabsTrigger
                                            key={item.id}
                                            value={item.id}
                                            className={cn(
                                                'w-full flex items-center justify-start gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer',
                                                'data-[state=active]:bg-primary data-[state=active]:text-primary-foreground',
                                                'data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-muted data-[state=inactive]:hover:text-foreground',
                                                'shadow-none border-none ring-0'
                                            )}
                                        >
                                            <Icon className="h-4 w-4" />
                                            {item.label}
                                        </TabsTrigger>
                                    );
                                })}
                            </TabsList>
                        </div>
                    </aside>

                    <div className="lg:col-span-9">
                        <Card className="p-6">
                            <TabsContent value="general" className="m-0 mt-0">
                                <SectionCard
                                    id="general"
                                    icon={Globe}
                                    title="Thông tin chung"
                                    description="Cấu hình thông tin cơ bản của website"
                                >
                                    <>
                                        <Field
                                            name="name"
                                            label="Tên trang web"
                                            placeholder="Việt Nam Solar"
                                            required
                                        />

                                        <Field
                                            name="description"
                                            label="Mô tả trang web"
                                            placeholder="Mô tả ngắn gọn về trang web"
                                            type="textarea"
                                            description="Mô tả này sẽ hiển thị trong kết quả tìm kiếm"
                                        />

                                        <Field
                                            name="domain"
                                            label="URL trang web"
                                            placeholder="https://vietnamsolar.jamstack.vn"
                                            required
                                        />

                                        <Field
                                            name="logo"
                                            label="Logo trang web"
                                            type="attachment"
                                            description="Logo chính của website, khuyến nghị kích thước 200x50px"
                                        />

                                        <Field
                                            name="favicon"
                                            label="Biểu tượng trang web (Favicon)"
                                            type="attachment"
                                            description="Icon hiển thị trên tab trình duyệt, khuyến nghị 32x32px hoặc 64x64px"
                                        />

                                        <Field
                                            name="featured_image"
                                            label="Hình ảnh trang web"
                                            type="attachment"
                                            description="Hình ảnh đại diện khi chia sẻ trên mạng xã hội (OG Image), khuyến nghị 1200x630px"
                                        />
                                    </>
                                </SectionCard>
                            </TabsContent>

                            <TabsContent value="smtp" className="m-0 mt-0">
                                <SectionCard
                                    id="smtp"
                                    icon={Mail}
                                    title="Cấu hình SMTP"
                                    description="Thiết lập máy chủ email để gửi thông báo"
                                >
                                    <>
                                        <Field
                                            name="smtp_host"
                                            label="SMTP Host"
                                            placeholder="smtp.gmail.com"
                                        />

                                        <div className="grid grid-cols-2 gap-4">
                                            <Field
                                                name="smtp_port"
                                                label="Port"
                                                placeholder="587"
                                                type="number"
                                            />

                                            <Field
                                                name="smtp_encryption"
                                                label="Mã hóa"
                                                type="select"
                                                options={[
                                                    { value: 'tls', label: 'TLS' },
                                                    { value: 'ssl', label: 'SSL' },
                                                    { value: 'none', label: 'Không' },
                                                ]}
                                            />
                                        </div>

                                        <Field
                                            name="smtp_username"
                                            label="Username"
                                            placeholder="your-email@gmail.com"
                                        />

                                        <Field
                                            name="smtp_password"
                                            label="Password"
                                            type="password"
                                            placeholder="••••••••"
                                        />

                                        <div className="grid grid-cols-2 gap-4">
                                            <Field
                                                name="smtp_from_email"
                                                label="Email người gửi"
                                                placeholder="noreply@example.com"
                                            />

                                            <Field
                                                name="smtp_from_name"
                                                label="Tên người gửi"
                                                placeholder="Website Name"
                                            />
                                        </div>
                                    </>
                                </SectionCard>
                            </TabsContent>

                            <TabsContent value="timezone" className="m-0 mt-0">
                                <SectionCard
                                    id="timezone"
                                    icon={Clock}
                                    title="Múi giờ"
                                    description="Chọn múi giờ mặc định cho hệ thống"
                                >
                                    <>
                                        <Field
                                            name="timezone"
                                            label="Múi giờ"
                                            type="select"
                                            options={timezoneOptions}
                                        />

                                        <div className="p-4 bg-muted rounded-lg flex items-start gap-3">
                                            <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                                            <div>
                                                <p className="text-sm text-muted-foreground">
                                                    <strong>Lưu ý:</strong> Múi giờ ảnh hưởng đến cách hiển thị thời gian trong toàn bộ hệ thống.
                                                </p>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    Thời gian hiện tại: {new Date().toLocaleString('vi-VN', {
                                                        timeZone: website?.timezone || 'Asia/Ho_Chi_Minh'
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                    </>
                                </SectionCard>
                            </TabsContent>

                            <TabsContent value="notifications" className="m-0 mt-0">
                                <SectionCard
                                    id="notifications"
                                    icon={Bell}
                                    title="Cấu hình thông báo"
                                    description="Quản lý email nhận thông báo từ hệ thống"
                                >
                                    <>
                                        <Field
                                            name="notification_emails"
                                            label="Email nhận thông báo"
                                            placeholder="admin@example.com, user@example.com"
                                            type="textarea"
                                            description="Nhập các email cách nhau bởi dấu phẩy. Các email này sẽ nhận thông báo về hoạt động quan trọng của hệ thống"
                                        />

                                        <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                                            <div className="flex gap-3">
                                                <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                                                <div className="space-y-1">
                                                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                                        Loại thông báo
                                                    </p>
                                                    <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                                                        <li>Đơn hàng mới</li>
                                                        <li>Đăng ký tài khoản mới</li>
                                                        <li>Lỗi hệ thống quan trọng</li>
                                                        <li>Cảnh báo bảo mật</li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                </SectionCard>
                            </TabsContent>
                            <div className="flex justify-end mt-6">
                                <Button type="submit" size="lg">
                                    Lưu tất cả thay đổi
                                </Button>
                            </div>
                        </Card>
                    </div>
                </Tabs>
            </FormPages>
        </AppLayout>
    );
};

export default Website;
