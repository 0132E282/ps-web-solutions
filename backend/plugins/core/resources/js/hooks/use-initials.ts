export function useInitials() {
    return (name: string) => {
        const initials = name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
        return initials;
    };
}
