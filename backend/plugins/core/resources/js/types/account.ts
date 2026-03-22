/**
 * Account interface
 * Represents the base authenticated user or staff record
 */
export interface Account {
    id: number;
    name: string;
    email: string;
    email_verified_at: string | null;
    roles: string[];
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
}
