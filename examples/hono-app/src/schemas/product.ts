import { product } from "@/db/product-schema";
import { createInsertSchema } from "drizzle-zod";
import { defineSchema } from "loompi";
import z from "zod";

export default defineSchema({
    kind: "collectionType",
    collectionName: "product",
    tableName: product,
    info: {
        singularName: "product",
        pluralName: "products",
        displayName: "products",
    },
    hooks: {
        repository: {
            beforeCreate: (data) => {
                if (!data.id) {
                    data.id = crypto.randomUUID();
                }
                return data;
            },
        },
    },
    validation: {
        request: {
            create: createInsertSchema(product, {
                name: z.string(),
                description: z.string(),
                SKU: z.string().min(3),
            }).omit({ id: true, createdAt: true }).strict(),
            update: createInsertSchema(product, {
                name: z.string(),
                description: z.string(),
                SKU: z.string().min(3),
                image: z.url(),
            }).omit({ id: true, createdAt: true }).partial().strict(),
        }
    }

})