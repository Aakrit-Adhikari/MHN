import http from "node:http";
import app from "./app.js";
import { env } from "./config/env.js";
import { createDefaultAdmin } from "./utils/default-admin.js";

let server: http.Server | null = null;

async function startServer() {
    await createDefaultAdmin();

    server = http.createServer(app);
    server.on("error", (error) => {
        if ((error as NodeJS.ErrnoException).code === "EADDRINUSE") {
            console.error(
                `Port ${env.PORT} is already in use. The backend is probably already running; stop the existing process or use a different PORT.`
            );
            process.exit(0);
        }

        console.error("Server error:", error);
        process.exit(1);
    });
    server.listen(env.PORT, () => {
        console.log(`Server running on http://localhost:${env.PORT}`);
    });
}

startServer().catch((error) => {
    console.error("Failed to start server:", error);
    process.exit(1);
});
