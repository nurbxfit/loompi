import { user } from "@/db/user-schema";
import { defineSchema } from "unstrap";
import { createInsertSchema } from 'drizzle-zod'
import { z } from 'zod';

export default defineSchema({
    kind: 'collectionType',
    collectionName: 'user',
    tableName: user,
    info: {
        singularName: 'user',
        pluralName: 'users',
        displayName: 'users',
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
        controller: {
            afterCreate: (ctx, data) => {
                // return ctx.res.json(); // dont do this , return manipulated data instead!!
                return { ...data, hooked: true }; // example manipulate the response data
            },
            afterUpdate: (ctx, data) => {
                return { ...data, hooked: true }; // example manipulate the response data
            }
        }
    },
    validation: {
        request: {
            create: createInsertSchema(user, {
                name: z.string(),
                email: z.email(),
            }).omit({ id: true, createdAt: true, emailVerified: true }).strict(),
            update: createInsertSchema(user, {
                name: z.string(),
                email: z.email(),
                image: z.url(),
            }).omit({ id: true, createdAt: true, emailVerified: true }).partial().strict(), // use strict so that zod can help sanitize.
        }
    },
})