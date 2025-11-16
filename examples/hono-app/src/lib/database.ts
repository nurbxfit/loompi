import Database from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import path from "path";

const databaseURL = path.join(__dirname, '..', '..', process.env.DATABASE_URL ?? '.tmp/data.db')
console.log('DatabseURL:', databaseURL);

const sqlite = new Database(databaseURL)
export const db = drizzle(sqlite);

export type DrizzleDatabase = typeof db;