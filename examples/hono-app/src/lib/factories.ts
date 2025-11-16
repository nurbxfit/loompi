import { createFactory } from "unstrap";
import { schemas } from "@/schemas";
import { createDrizzleRepositoryFactory } from "@unstrap/drizzle";
import { db } from "./database";


const repository = createDrizzleRepositoryFactory(db, schemas, {
    dialect: 'sqlite'
})

export const factories = createFactory({
    repository,
    schemas: schemas
})