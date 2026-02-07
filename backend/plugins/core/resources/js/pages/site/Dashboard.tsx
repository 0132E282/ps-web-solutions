import AppLayout from "@core/layouts/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@core/components/ui/card";
import {
    Users,
    MousePointer2,
    Eye,
    TrendingUp,
    LayoutDashboard,
    ArrowUpRight,
    ArrowDownRight
} from "lucide-react";

interface Stats {
    visits: number;
    visitors: number;
    pageviews: number;
    bounce_rate: string;
}

interface Props {
    stats: Stats;
}

const Dashboard = ({ stats }: Props) => {
    const statCards = [
        {
            title: "Tổng lượt truy cập",
            value: stats.visits.toLocaleString(),
            icon: MousePointer2,
            trend: "+12.5%",
            isUp: true,
            color: "text-blue-500",
            bg: "bg-blue-500/10"
        },
        {
            title: "Khách truy cập",
            value: stats.visitors.toLocaleString(),
            icon: Users,
            trend: "+5.2%",
            isUp: true,
            color: "text-purple-500",
            bg: "bg-purple-500/10"
        },
        {
            title: "Lượt xem trang",
            value: stats.pageviews.toLocaleString(),
            icon: Eye,
            trend: "+18.3%",
            isUp: true,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10"
        },
        {
            title: "Tỷ lệ thoát",
            value: stats.bounce_rate,
            icon: TrendingUp,
            trend: "-2.4%",
            isUp: false,
            color: "text-rose-500",
            bg: "bg-rose-500/10"
        }
    ];

    return (
        <AppLayout>
            <div className="flex flex-col gap-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">Dashboard</h1>
                    <p className="text-muted-foreground flex items-center gap-2">
                        <LayoutDashboard className="w-4 h-4" />
                        Chào mừng bạn trở lại! Đây là tổng quan về hiệu suất website của bạn.
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {statCards.map((card, idx) => (
                        <Card key={idx} className="overflow-hidden border-none shadow-sm hover:shadow-md transition-shadow">
                            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                <CardTitle className="text-sm font-medium">
                                    {card.title}
                                </CardTitle>
                                <div className={`p-2 rounded-xl ${card.bg}`}>
                                    <card.icon className={`w-4 h-4 ${card.color}`} />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{card.value}</div>
                                <div className="flex items-center mt-1">
                                    {card.isUp ? (
                                        <ArrowUpRight className="w-3 h-3 text-emerald-500 mr-1" />
                                    ) : (
                                        <ArrowDownRight className="w-3 h-3 text-rose-500 mr-1" />
                                    )}
                                    <span className={`text-xs font-medium ${card.isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        {card.trend}
                                    </span>
                                    <span className="text-xs text-muted-foreground ml-1">so với tháng trước</span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                    <Card className="col-span-4 border-none shadow-sm">
                        <CardHeader>
                            <CardTitle>Biểu đồ lưu lượng</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[300px] flex items-center justify-center bg-accent/5 rounded-lg border border-dashed">
                             <div className="text-center">
                                <TrendingUp className="w-12 h-12 text-muted-foreground/30 mx-auto mb-2" />
                                <p className="text-sm text-muted-foreground">Tính năng biểu đồ đang được phát triển...</p>
                             </div>
                        </CardContent>
                    </Card>

                    <Card className="col-span-3 border-none shadow-sm">
                        <CardHeader>
                            <CardTitle>Trang xem nhiều nhất</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {[
                                    { page: "/", views: "1,240", visitors: "840" },
                                    { page: "/products", views: "850", visitors: "420" },
                                    { page: "/blog/hello-world", views: "420", visitors: "310" },
                                    { page: "/contact", views: "120", visitors: "95" },
                                ].map((row, i) => (
                                    <div key={i} className="flex items-center justify-between">
                                        <div className="text-sm font-medium truncate max-w-[150px]">{row.page}</div>
                                        <div className="flex gap-4">
                                            <div className="text-xs text-muted-foreground text-right w-16">
                                                <div className="font-bold text-foreground">{row.views}</div>
                                                lượt xem
                                            </div>
                                            <div className="text-xs text-muted-foreground text-right w-16">
                                                <div className="font-bold text-foreground">{row.visitors}</div>
                                                khách
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
};

export default Dashboard;
