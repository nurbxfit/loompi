import { SQL, and, or, eq, ne, gt, gte, lt, lte, like, ilike, inArray, notInArray, isNull, isNotNull, between, not, asc, desc, sql } from 'drizzle-orm';
import type { SQLiteTable } from 'drizzle-orm/sqlite-core';
import { ParsedFilters } from 'unstrap';

export function buildWhereClause(
    table: SQLiteTable,
    filters: ParsedFilters
): SQL | undefined {
    const conditions: SQL[] = [];

    for (const [field, value] of Object.entries(filters)) {
        // Handle logical operators
        if (field === '$and' && Array.isArray(value)) {
            const andConditions = value
                .map(filter => buildWhereClause(table, filter))
                .filter(Boolean) as SQL[];
            if (andConditions.length) {
                conditions.push(and(...andConditions)!);
            }
            continue;
        }

        if (field === '$or' && Array.isArray(value)) {
            const orConditions = value
                .map(filter => buildWhereClause(table, filter))
                .filter(Boolean) as SQL[];
            if (orConditions.length) {
                conditions.push(or(...orConditions)!);
            }
            continue;
        }

        // Handle field operators
        const column = (table as any)[field];
        if (!column) {
            console.warn(`Unknown field: ${field}`);
            continue;
        }

        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            for (const [operator, operatorValue] of Object.entries(value)) {
                const condition = applyOperator(column, operator, operatorValue);
                if (condition) {
                    conditions.push(condition);
                }
            }
        } else {
            // Direct equality if no operator specified
            conditions.push(eq(column, value));
        }
    }

    return conditions.length ? and(...conditions) : undefined;
}

function applyOperator(column: any, operator: string, value: any): SQL | undefined {
    switch (operator) {
        case '$eq':
            return eq(column, value);
        case '$ne':
            return ne(column, value);
        case '$gt':
            return gt(column, value);
        case '$gte':
            return gte(column, value);
        case '$lt':
            return lt(column, value);
        case '$lte':
            return lte(column, value);
        case '$in':
            return Array.isArray(value) ? inArray(column, value) : undefined;
        case '$notIn':
            return Array.isArray(value) ? notInArray(column, value) : undefined;
        case '$contains':
            return like(column, `%${value}%`);
        case '$notContains':
            return not(like(column, `%${value}%`));
        case '$containsi':
            return ilike(column, `%${value}%`);
        case '$startsWith':
            return like(column, `${value}%`);
        case '$endsWith':
            return like(column, `%${value}`);
        case '$null':
            return value === true ? isNull(column) : isNotNull(column);
        case '$notNull':
            return value === true ? isNotNull(column) : isNull(column);
        case '$between':
            return Array.isArray(value) && value.length === 2
                ? between(column, value[0], value[1])
                : undefined;
        default:
            console.warn(`Unknown operator: ${operator}`);
            return undefined;
    }
}

export function buildOrderBy(
    table: SQLiteTable,
    sorts: Array<{ field: string; order: 'asc' | 'desc' }>
): SQL[] {
    return sorts
        .map(({ field, order }) => {
            const column = (table as any)[field];
            if (!column) {
                console.warn(`Unknown sort field: ${field}`);
                return null;
            }
            return order === 'asc' ? asc(column) : desc(column);
        })
        .filter(Boolean) as SQL[];
}