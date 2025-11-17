/**
 * For reference
 */

export const ERROR_CODES = {
    // Validation errors
    VALIDATION_FAILED: 'validation_failed',
    INVALID_JSON: 'invalid_json',
    INVALID_FORMAT: 'invalid_format',
    EMPTY_DATA: 'empty_data',

    // Database constraint errors
    DUPLICATE_ENTRY: 'duplicate_entry',
    INVALID_REFERENCE: 'invalid_reference',
    REQUIRED_FIELD: 'required_field',
    CONSTRAINT_VIOLATION: 'constraint_violation',

    // Resource errors
    NOT_FOUND: 'not_found',
    UNAUTHORIZED: 'unauthorized',
    FORBIDDEN: 'forbidden',

    // Server errors
    INTERNAL_ERROR: 'internal_server_error',
    DATABASE_ERROR: 'database_error',
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];