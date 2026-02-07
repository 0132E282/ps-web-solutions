import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@core/components/ui/card";
import AppLayout from "@core/layouts/app-layout";
import { usePage, Link } from "@inertiajs/react";
import { route } from "@core/lib/route";
import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface ConfigurationCard {
    title: string;
    description: string;
    icon: string;
    route: string;
    params?: Record<string, string | number>;
}

interface ConfigurationSection {
    title: string;
    cards: ConfigurationCard[];
}

interface PageProps {
    sections: ConfigurationSection[];
    [key: string]: unknown;
}

const Index = () => {
    const { props } = usePage<PageProps>();
    const { sections = [] } = props;

    const getIcon = (iconName: string): LucideIcon => {
        const IconComponent = (LucideIcons as unknown as Record<string, LucideIcon>)[iconName];
        return IconComponent || LucideIcons.Settings;
    };

    return (
        <AppLayout>
            <div className="space-y-8">
                {sections.length === 0 ? (
                    <Card>
                        <CardContent className="py-16 text-center">
                            <LucideIcons.Settings className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                            <p className="text-base text-muted-foreground">
                                Không có cấu hình nào
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    sections.map((section, sectionIndex) => (
                        <div key={sectionIndex} className="space-y-4">
                            <div>
                                <h2 className="text-2xl font-semibold mb-1">{section.title}</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {section.cards.map((card, cardIndex) => {
                                    const IconComponent = getIcon(card.icon);
                                    return (
                                        <Link
                                            key={cardIndex}
                                            href={route(card.route, card.params)}
                                            className="block"
                                        >
                                            <Card className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50">
                                                <CardHeader>
                                                    <div className="flex items-start gap-4">
                                                        <div className="p-2 rounded-lg bg-primary/10">
                                                            <IconComponent className="h-6 w-6 text-primary" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <CardTitle className="text-lg mb-1">
                                                                {card.title}
                                                            </CardTitle>
                                                            <CardDescription className="text-sm">
                                                                {card.description}
                                                            </CardDescription>
                                                        </div>
                                                    </div>
                                                </CardHeader>
                                            </Card>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </AppLayout>
    );
};

export default Index;

