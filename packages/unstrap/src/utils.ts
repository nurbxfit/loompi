
export function createPaginationResponse(page: number, pageSize: number, total: number) {
    return {
        page,
        pageSize,
        pageCount: Math.ceil(total / pageSize),
        total
    }
}