import { createFactory } from "loompi";
import { schemas } from "@/schemas";
import { createDrizzleRepositoryFactory } from "@loompi/drizzle";
import { db } from "./database";


const repository = createDrizzleRepositoryFactory(db, schemas, {
    dialect: 'sqlite'
})

export const factories = createFactory({
    repository,
    schemas: schemas
})