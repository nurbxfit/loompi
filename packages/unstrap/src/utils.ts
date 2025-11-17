import z from "zod";
import { ErrorResponse } from "./types";

export function createPaginationResponse(page: number, pageSize: number, total: number) {
    return {
        page,
        pageSize,
        pageCount: Math.ceil(total / pageSize),
        total
    }
}

export function formatZodErrors(error: z.ZodError): {
    details: any,
    fields: {
        field: string,
        message: string,
        code: string
    }[]
} {
    return {
        // Nested format (Zod's default)
        details: error.issues,

        // Flat array format (easy to display)
        fields: error.issues.map(issue => ({
            field: issue.path.join('.') as string,
            message: issue.message as string,
            code: issue.code as string  // Optional: error code (e.g., 'invalid_type')
        }))
    };
}

export function createErrorResponse(
    message: string,
    options?: {
        details?: any;
        statusCode?: number;
        fields?: Array<{ field: string; message: string, code: string }>;
        example?: any;
    }
): ErrorResponse {
    return {
        error: {
            message,
            statusCode: options?.statusCode || 400,
            details: options?.details,
            fields: options?.fields,
            example: options?.example
        }
    };
}

export function createValidationErrorResponse(zodError: z.ZodError): ErrorResponse {
    const formatted = formatZodErrors(zodError);

    return {
        error: {
            message: 'Validation failed',
            statusCode: 400,
            details: formatted.details,
            fields: formatted.fields
        }
    };
}