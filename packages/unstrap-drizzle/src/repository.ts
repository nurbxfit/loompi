import { FindOptions, Repository, SchemaDefinition } from "unstrap";
import { buildOrderBy, buildWhereClause } from "./query-builder";
import { eq, sql } from "drizzle-orm";

export class DrizzleRepository<T = any> implements Repository<T> {
    constructor(
        private db: any, // Drizzle ??,
        private table: any,
        private schema: SchemaDefinition,
        private dialect: 'pg' | 'mysql' | 'sqlite' = 'sqlite',
    ) { }

    async find(options: FindOptions): Promise<{ data: T[]; total: number; }> {
        let query = this.db.select().from(this.table);

        if (options.filters) {
            const whereClause = buildWhereClause(this.table, options.filters);
            if (whereClause) {
                query = query.where(whereClause) as any;
            }
        }

        if (options.sort?.length) {
            query = query.orderBy(...buildOrderBy(this.table, options.sort)) as any;
        }

        if (options.pagination) {
            const { page, pageSize } = options.pagination;
            query = query
                .limit(pageSize)
                .offset((page - 1) * pageSize) as any;
        }

        const data = await query;

        let countQuery = this.db
            .select({ count: sql<number>`count(*)` })
            .from(this.table);

        if (options.filters) {
            const whereClause = buildWhereClause(this.table, options.filters);
            if (whereClause) {
                countQuery = countQuery.where(whereClause) as any;
            }
        }

        const [{ count: total }] = await countQuery;

        return { data: data as T[], total };

    }

    async findOne(id: string | number) {
        const [result] = await this.db
            .select()
            .from(this.table)
            .where(eq((this.table as any).id, id))
            .limit(1);

        return result as T | null;
    }

    async create(data: Partial<T>) {

        // calling before create hook
        if (this.schema.hooks?.repository?.beforeCreate) {
            data = await this.schema.hooks?.repository?.beforeCreate(data);
        }

        // MySQL doesn't support RETURNING
        if (this.dialect === 'mysql') {
            const result = await this.db
                .insert(this.table)
                .values(data as any);

            // Fetch the inserted record by ID
            const insertId = result.insertId;
            return this.findOne(insertId) as Promise<T>;
        }

        // PostgreSQL and SQLite support RETURNING
        const [result] = await this.db
            .insert(this.table)
            .values(data as any)
            .returning();

        // calling after create hook

        if (this.schema.hooks?.repository?.afterCreate) {
            await this.schema.hooks?.repository?.afterCreate(result);
        }

        return result as T;
    }

    async update(id: string | number, data: Partial<T>) {
        // MySQL doesn't support RETURNING
        if (this.dialect === 'mysql') {
            await this.db
                .update(this.table)
                .set(data as any)
                .where(eq((this.table as any).id, id));

            // Fetch the updated record
            return this.findOne(id);
        }

        // PostgreSQL and SQLite support RETURNING
        const [result] = await this.db
            .update(this.table)
            .set(data as any)
            .where(eq((this.table as any).id, id))
            .returning();

        return result as T | null;
    }

    async delete(id: string | number) {
        // Fetch before delete for MySQL compatibility
        const existing = await this.findOne(id);

        if (!existing) return null;

        await this.db
            .delete(this.table)
            .where(eq((this.table as any).id, id));

        return existing;
    }

}