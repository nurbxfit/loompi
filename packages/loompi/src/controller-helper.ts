import { ERROR_CODES } from "./error-codes";
import { RequestContext } from "./types";
import { createErrorResponse } from "./utils";

/**
 * Perform basic validation on request body
 * @param body 
 * @param operation 
 * @returns 
 */

export function validateRequestData(body: any, operation: 'create' | 'update'): { error?: any } {
    if (!body.data) {
        return {
            error: createErrorResponse('Invalid request format', {
                details: 'Request body must contain a "data" field',
                example: {
                    data: operation === 'create'
                        ? { name: 'John Doe', email: 'john@example.com' }
                        : { name: 'Updated Name' }
                }
            })
        }
    }

    if (!body.data || (typeof body.data === 'object' && Object.keys(body.data).length === 0)) {
        return {
            error: createErrorResponse('Validation failed', {
                details: `${operation === 'create' ? 'Request' : 'Update'} data cannot be empty`
            })
        };
    }

    return {}
}

/**
 *  Handler Not found Error
 * @param ctx 
 * @param id 
 * @returns 
 */

export function handleNotFoundError(ctx: RequestContext, id?: string | number) {
    return ctx.res.json(
        createErrorResponse('Not found', {
            statusCode: 404,
            details: id ? `Resource with id "${id}" not found` : 'Resource not found'
        }),
        404
    )
}


/**
 * General
 * Help parsing error, into appropriate error response
 * @param ctx 
 * @param error 
 */
export function handleControllerError(ctx: RequestContext, error: any) {
    // JSON parse error
    if (error instanceof SyntaxError) {
        return ctx.res.json(
            createErrorResponse('Invalid JSON', {
                details: 'Request body must be valid JSON'
            }),
            400
        );
    }

    // Unique constraint violation
    if (isUniqueConstraintError(error)) {
        return ctx.res.json(
            createErrorResponse('Duplicate entry', {
                statusCode: 409,
                details: 'A record with this value already exists',
                fields: extractConstraintField(error, 'unique')
            }),
            409
        );
    }

    // Foreign key constraint
    if (isForeignKeyError(error)) {
        return ctx.res.json(
            createErrorResponse('Invalid reference', {
                statusCode: 400,
                details: 'Referenced record does not exist',
                fields: extractConstraintField(error, 'foreign_key')
            }),
            400
        );
    }

    // Not null constraint
    if (isNotNullError(error)) {
        return ctx.res.json(
            createErrorResponse('Missing required field', {
                statusCode: 400,
                details: 'A required field is missing',
                fields: extractConstraintField(error, 'not_null')
            }),
            400
        );
    }

    // Generic error
    const errorMessage = error instanceof Error ? error.message : String(error);
    return ctx.res.json(
        createErrorResponse('Internal server error', {
            statusCode: 500,
            details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
        }),
        500
    );
}

/**
 * Check if error is unique constraint violation
 */
function isUniqueConstraintError(error: any): boolean {
    return (
        error.code === '23505' || // PostgreSQL
        error.code === 'SQLITE_CONSTRAINT' || // SQLite
        error.errno === 1062 || // MySQL
        error.message?.includes('unique constraint') ||
        error.message?.includes('UNIQUE constraint')
    );
}

/**
 * Check if error is foreign key constraint violation
 */
function isForeignKeyError(error: any): boolean {
    return (
        error.code === '23503' || // PostgreSQL
        error.errno === 1452 || // MySQL
        error.message?.includes('foreign key constraint') ||
        error.message?.includes('FOREIGN KEY constraint')
    );
}

/**
 * Check if error is not null constraint violation
 */
function isNotNullError(error: any): boolean {
    return (
        error.code === '23502' || // PostgreSQL
        error.errno === 1048 || // MySQL
        error.message?.includes('NOT NULL constraint')
    );
}

/**
 * Extract field name from constraint error
 */
function extractConstraintField(
    error: any,
    errorType: 'unique' | 'foreign_key' | 'not_null'
): Array<{ field: string; message: string; code: string }> | undefined {
    // Try to extract field name from error message
    const match = error.message?.match(/column "([^"]+)"/i) ||
        error.message?.match(/field '([^']+)'/i) ||
        error.message?.match(/`([^`]+)`/) ||
        error.message?.match(/key '([^']+)'/i);

    if (match && match[1]) {
        const field = match[1];

        // Generate appropriate message and code based on error type
        const errorInfo = getErrorInfo(errorType, field);

        return [{
            field: field,
            message: errorInfo.message,
            code: errorInfo.code
        }];
    }

    return undefined;
}

/**
 * Get error message and code based on error type
 */
function getErrorInfo(errorType: 'unique' | 'foreign_key' | 'not_null', field: string) {
    switch (errorType) {
        case 'unique':
            return {
                message: `Value for "${field}" already exists`,
                code: ERROR_CODES.DUPLICATE_ENTRY
            };
        case 'foreign_key':
            return {
                message: `Referenced ${field} does not exist`,
                code: ERROR_CODES.INVALID_REFERENCE // 'invalid_reference'
            };
        case 'not_null':
            return {
                message: `Field "${field}" is required`,
                code: ERROR_CODES.REQUIRED_FIELD //'required_field'
            };
        default:
            return {
                message: `Field "${field}" violates constraint`,
                code: ERROR_CODES.CONSTRAINT_VIOLATION// 'constraint_violation'
            };
    }
}