
/**
 * Helper function to help create schema definition 
 * with type safety, and validations
 */

import { SchemaConfig, SchemaDefinition } from "./types";

export function defineSchema<TTable = any>(
    config: SchemaConfig<TTable>
): SchemaDefinition<TTable> {
    const defaultErrorText = `Invalid Schema definition`;
    if (!config.collectionName) {
        throw new Error(`${defaultErrorText}: collectionName is required`)
    }
    if (!config.tableName) {
        throw new Error(`${defaultErrorText}: tableName is required`)
    }
    if (!config.info.singularName || !config.info.pluralName) {
        throw new Error(`${defaultErrorText}: singularName and pluralName are required`)
    }

    if (!config.info.displayName) {
        config.info.displayName = config.info.singularName
            .charAt(0).toUpperCase() + config.info.singularName.slice(1);
    }

    return {
        ...config,
        _validated: true,
    } as SchemaDefinition<TTable>
}

/**
 * Usage Example
 * for example inside our project
 * src/api/users/schema/user.ts
 */

// export const UserSchema = defineSchema({
//     kind: 'collectionType',
//     collectionName: 'users',
//     tableName: users,
//     info: {
//         singularName: 'user',
//         pluralName: 'users',
//         displayName: 'User', // Optional now
//     },
//     validation: {
//         insert: createInsertSchema(users).omit({ id: true }),
//         update: createInsertSchema(users).omit({ id: true }).partial(),
//     }
// });