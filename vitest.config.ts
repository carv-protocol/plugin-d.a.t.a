import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
    test: {
        environment: "node",
        testTimeout: 120000,
        coverage: {
            reporter: ["text", "json", "html"],
            exclude: ["node_modules/", "dist/"],
        },
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
});
