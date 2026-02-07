export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface BasePageProps {
    ziggy?: {
        route?: {
            name?: string;
        };
        [key: string]: unknown;
    };
    [key: string]: unknown;
}

export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at?: string;
    created_at?: string;
    updated_at?: string;
    [key: string]: unknown; // Allow extra properties for flexibility
}

export interface SharedData extends BasePageProps {
    auth: {
        user: User;
    };
    sidebarOpen?: boolean;
    name: string;
    quote?: {
        message: string;
        author: string;
    };
}
