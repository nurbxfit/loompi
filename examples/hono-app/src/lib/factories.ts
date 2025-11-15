import { createFactory } from "unstrap";
import { mockRepoFactory } from "./repository";
import { schemas } from "@/schemas";



export const factories = createFactory({
    repository: mockRepoFactory, // issue is here,
    schemas: schemas
})