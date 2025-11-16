export interface ParsedFilters {
    [field: string]: {
        [operator: string]: any;
    } | ParsedFilters[];
}

export function parseFilters(query: Record<string, any>): ParsedFilters {
    const filters: ParsedFilters = {};

    for (const [key, value] of Object.entries(query)) {
        if (key.startsWith('filters[')) {
            const path = key
                .replace(/^filters/, '')
                .replace(/\[/g, '.')
                .replace(/\]/g, '')
                .split('.')
                .filter(Boolean);

            let current: any = filters;
            for (let i = 0; i < path.length - 1; i++) {
                const segment = path[i];

                // Handle array indices for $and, $or
                if (/^\d+$/.test(segment)) {
                    const index = parseInt(segment);
                    const parent = path[i - 1];
                    if (!Array.isArray(current[parent])) {
                        current[parent] = [];
                    }
                    if (!current[parent][index]) {
                        current[parent][index] = {};
                    }
                    current = current[parent][index];
                } else {
                    if (!current[segment]) {
                        current[segment] = {};
                    }
                    current = current[segment];
                }
            }

            const lastSegment = path[path.length - 1];
            current[lastSegment] = value;
        }
    }
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