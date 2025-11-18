import type { Repository, FindOptions, RepositoryFactory } from 'loompi';

export class MockRepository implements Repository {
    constructor(
        private prefix: string,
    ) { }
    async find(options: FindOptions): Promise<{ data: any[]; total: number }> {
        return {
            data: [
                { id: 1, name: `${this.prefix}-John`, email: 'john@example.com' },
                { id: 2, name: `${this.prefix}-Jane`, email: 'jane@example.com' },
            ],
            total: 2
        };
    }

    async findOne(id: string | number): Promise<any> {
        return { id, name: `${this.prefix}-John`, email: 'john@example.com' };
    }

    async create(data: any): Promise<any> {
        return { id: 1, ...data };
    }

    async update(id: string | number, data: any): Promise<any> {
        return { id, ...data };
    }

    async delete(id: string | number): Promise<any> {
        return { id, name: `${this.prefix}-John` };
    }
}


export const mockRepoFactory: RepositoryFactory = (schemaName: string) => {
    return new MockRepository(schemaName);
};