
import { defineConfig } from "drizzle-kit";
import path from 'path';

const databseURL = path.join(__dirname, process.env.DATABASE_URL ?? '.tmp/data.db');
console.log('DATABASE_URL:', databseURL)

export default defineConfig({
    dialect: "sqlite",
    schema: "./src/db/*.ts",
    dbCredentials: {
        url: databseURL
    },
});
