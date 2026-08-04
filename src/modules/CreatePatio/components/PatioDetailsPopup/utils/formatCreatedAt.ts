/** `2025-09-12T10:00:00Z` → `12.09.2025`, the dotted format the design shows. */
export const formatCreatedAt = (isoDate: string): string => {
    return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
        .format(new Date(isoDate))
        .replaceAll('/', '.');
};
