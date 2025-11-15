import { defineSchema } from "unstrap";

export default defineSchema({
    kind: 'collectionType',
    collectionName: 'user',
    tableName: 'user',
    info: {
        singularName: 'user',
        pluralName: 'users',
        displayName: 'users',
    }
})