export interface ParsedFilters {
    [field: string]: {
        [operator: string]: any;
    } | ParsedFilters[];
}

export function parseFilters(query: Record<string, any>): ParsedFilters {
    const filters: ParsedFilters = {};

    // todo parsing filters based on strapi spec

    return filters
}

export function parsePagination(query: Record<string, any>) {
    return {
        page: parseInt(query['pagination[page]'] || '1'),
        pageSize: parseInt(query['pagination[pageSize]'] || '25'),
    };
}

export function parseSort(query: Record<string, any>): Array<{ field: string; order: 'asc' | 'desc' }> {
    const sortParam = query.sort;
    if (!sortParam) return [];

    return sortParam.split(',').map((item: string) => {
        const order = item.startsWith('-') ? 'desc' : 'asc';
        const field = item.replace(/^-/, '');
        return { field, order };
    });
}