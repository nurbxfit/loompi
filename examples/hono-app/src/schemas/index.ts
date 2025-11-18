import { SchemaRegistry } from "loompi";
import userSchema from './user';
import productSchema from './product';

export const schemas: SchemaRegistry = {
    "api::user.user": userSchema,
    "api::product.product": productSchema
} as const;