import { SchemaRegistry } from "unstrap";
import userSchema from './user';

export const schemas: SchemaRegistry = {
    "api::user.user": userSchema
} as const;