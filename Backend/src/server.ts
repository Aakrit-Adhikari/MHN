import app from "./app.js";
import { createDefaultAdmin } from "./admin/admin.auth.js";
import { env } from "./config/env.js";

async function startServer() {
    await createDefaultAdmin();

    app.listen(env.PORT, () => {
        console.log(`Server running on http://localhost:${env.PORT}`);
        console.log(`Admin panel running on http://localhost:${env.PORT}/admin`);
    });
}

startServer();