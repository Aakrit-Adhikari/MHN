import { Router } from "express";
import { openApiDocument } from "./openapi.js";

const router = Router();

const swaggerHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Mountain Helicopters Nepal API Docs</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  <style>
    body { margin: 0; background: #f7f7f7; }
    .swagger-ui .topbar { display: none; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    window.ui = SwaggerUIBundle({
      url: "/api-docs.json",
      dom_id: "#swagger-ui",
      deepLinking: true,
      presets: [SwaggerUIBundle.presets.apis],
      layout: "BaseLayout",
      persistAuthorization: true
    });
  </script>
</body>
</html>`;

router.get("/api-docs.json", (_req, res) => {
    res.status(200).json(openApiDocument);
});

router.get("/api-docs", (_req, res) => {
    res.status(200).type("html").send(swaggerHtml);
});

export default router;
