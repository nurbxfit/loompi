import { SchemaRegistry } from "loompi";
import userSchema from './user';

export const schemas: SchemaRegistry = {
    "api::user.user": userSchema
} as const;