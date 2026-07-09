const apiResponse = (schema: unknown) => ({
    type: "object",
    required: ["success", "data"],
    properties: {
        success: { type: "boolean", example: true },
        data: schema,
    },
});

const messageResponse = {
    type: "object",
    required: ["success", "message"],
    properties: {
        success: { type: "boolean", example: false },
        message: { type: "string" },
    },
};

const idParam = (name: string, description: string) => ({
    name,
    in: "path",
    required: true,
    description,
    schema: { type: "string" },
});

export const openApiDocument = {
    openapi: "3.0.3",
    info: {
        title: "Mountain Helicopters Nepal API",
        version: "1.0.0",
        description: "API documentation for authentication, tours, inquiries, and blog posts.",
    },
    servers: [
        {
            url: "http://localhost:5000",
            description: "Local development server",
        },
    ],
    tags: [
        { name: "Auth", description: "Authentication endpoints" },
        { name: "Tours", description: "Tour listing and admin management" },
        { name: "Inquiries", description: "Customer inquiry submission and admin management" },
        { name: "Blogs", description: "Public blog endpoints" },
        { name: "Admin Blogs", description: "Admin blog management" },
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: "http",
                scheme: "bearer",
                bearerFormat: "JWT",
            },
        },
        schemas: {
            ErrorResponse: messageResponse,
            LoginRequest: {
                type: "object",
                required: ["email", "password"],
                properties: {
                    email: { type: "string", format: "email", example: "admin@example.com" },
                    password: { type: "string", example: "password123" },
                },
            },
            User: {
                type: "object",
                properties: {
                    id: { type: "string" },
                    email: { type: "string", format: "email" },
                    name: { type: "string", nullable: true },
                    role: { type: "string", enum: ["ADMIN", "EMPLOYEE", "CUSTOMER"] },
                },
            },
            LoginResponse: apiResponse({
                type: "object",
                properties: {
                    token: { type: "string" },
                    user: { $ref: "#/components/schemas/User" },
                },
            }),
            Tour: {
                type: "object",
                properties: {
                    id: { type: "string" },
                    slug: { type: "string" },
                    title: { type: "string" },
                    summary: { type: "string" },
                    description: { type: "string" },
                    metaTitle: { type: "string", nullable: true },
                    metaDescription: { type: "string", nullable: true },
                    categoryId: { type: "string", nullable: true },
                    price: { type: "integer", nullable: true },
                    duration: { type: "string", nullable: true },
                    altitude: { type: "string", nullable: true },
                    location: { type: "string", nullable: true },
                    groupSize: { type: "string", nullable: true },
                    bestSeason: { type: "string", nullable: true },
                    coverImageUrl: { type: "string", nullable: true },
                    contentImageUrl: { type: "string", nullable: true },
                    createdAt: { type: "string", format: "date-time" },
                    updatedAt: { type: "string", format: "date-time" },
                },
            },
            TourInput: {
                type: "object",
                required: ["title", "summary", "description"],
                properties: {
                    title: { type: "string", minLength: 5 },
                    slug: { type: "string", description: "Optional. Generated from title when omitted." },
                    summary: { type: "string", minLength: 10, maxLength: 255 },
                    description: { type: "string" },
                    metaTitle: { type: "string", nullable: true },
                    metaDescription: { type: "string", nullable: true },
                    categoryId: { type: "string", nullable: true },
                    price: { type: "integer", minimum: 1, nullable: true },
                    duration: { type: "string", nullable: true },
                    altitude: { type: "string", nullable: true },
                    location: { type: "string", nullable: true },
                    groupSize: { type: "string", nullable: true },
                    bestSeason: { type: "string", nullable: true },
                    contentImageUrl: { type: "string", nullable: true },
                    coverImage: { type: "string", format: "binary" },
                },
            },
            TourUpdateInput: {
                type: "object",
                properties: {
                    title: { type: "string", minLength: 5 },
                    slug: { type: "string" },
                    summary: { type: "string", minLength: 10, maxLength: 255 },
                    description: { type: "string" },
                    metaTitle: { type: "string", nullable: true },
                    metaDescription: { type: "string", nullable: true },
                    categoryId: { type: "string", nullable: true },
                    price: { type: "integer", minimum: 1, nullable: true },
                    duration: { type: "string", nullable: true },
                    altitude: { type: "string", nullable: true },
                    location: { type: "string", nullable: true },
                    groupSize: { type: "string", nullable: true },
                    bestSeason: { type: "string", nullable: true },
                    contentImageUrl: { type: "string", nullable: true },
                    coverImage: { type: "string", format: "binary" },
                },
            },
            BlogPost: {
                type: "object",
                properties: {
                    id: { type: "string" },
                    slug: { type: "string" },
                    title: { type: "string" },
                    content: { type: "string" },
                    metaTitle: { type: "string", nullable: true },
                    metaDescription: { type: "string", nullable: true },
                    imageUrl: { type: "string", nullable: true },
                    createdAt: { type: "string", format: "date-time" },
                    updatedAt: { type: "string", format: "date-time" },
                },
            },
            BlogPostInput: {
                type: "object",
                required: ["title", "content"],
                properties: {
                    slug: { type: "string", description: "Optional. Generated from title when omitted." },
                    title: { type: "string", minLength: 3 },
                    content: { type: "string", minLength: 10 },
                    metaTitle: { type: "string", nullable: true },
                    metaDescription: { type: "string", nullable: true },
                    imageUrl: { type: "string", nullable: true },
                    coverImage: { type: "string", format: "binary" },
                },
            },
            BlogPostUpdateInput: {
                type: "object",
                properties: {
                    slug: { type: "string" },
                    title: { type: "string", minLength: 3 },
                    content: { type: "string", minLength: 10 },
                    metaTitle: { type: "string", nullable: true },
                    metaDescription: { type: "string", nullable: true },
                    imageUrl: { type: "string", nullable: true },
                    coverImage: { type: "string", format: "binary" },
                },
            },
            Inquiry: {
                type: "object",
                properties: {
                    id: { type: "string" },
                    inquiryType: { type: "string", enum: ["CONTACT", "CHARTER", "BOOKING"] },
                    name: { type: "string" },
                    email: { type: "string", format: "email" },
                    phone: { type: "string", nullable: true },
                    preferredDate: { type: "string", format: "date-time", nullable: true },
                    message: { type: "string" },
                    status: { type: "string", enum: ["NEW", "IN_PROGRESS", "CONTACTED", "CONVERTED", "CLOSED"] },
                    tourId: { type: "string", nullable: true },
                    createdAt: { type: "string", format: "date-time" },
                    updatedAt: { type: "string", format: "date-time" },
                },
            },
            InquiryInput: {
                type: "object",
                required: ["inquiryType", "name", "email", "message"],
                properties: {
                    inquiryType: { type: "string", enum: ["CONTACT", "CHARTER", "BOOKING"] },
                    name: { type: "string", minLength: 2 },
                    email: { type: "string", format: "email" },
                    phone: { type: "string", nullable: true },
                    preferredDate: { type: "string", format: "date-time", nullable: true },
                    message: { type: "string", minLength: 10 },
                    status: { type: "string", enum: ["NEW", "IN_PROGRESS", "CONTACTED", "CONVERTED", "CLOSED"] },
                    tourId: { type: "string", nullable: true, description: "Required when inquiryType is BOOKING." },
                },
            },
            InquiryUpdateInput: {
                type: "object",
                properties: {
                    inquiryType: { type: "string", enum: ["CONTACT", "CHARTER", "BOOKING"] },
                    name: { type: "string", minLength: 2 },
                    email: { type: "string", format: "email" },
                    phone: { type: "string", nullable: true },
                    preferredDate: { type: "string", format: "date-time", nullable: true },
                    message: { type: "string", minLength: 10 },
                    status: { type: "string", enum: ["NEW", "IN_PROGRESS", "CONTACTED", "CONVERTED", "CLOSED"] },
                    tourId: { type: "string", nullable: true },
                },
            },
        },
    },
    paths: {
        "/api/auth/login": {
            post: {
                tags: ["Auth"],
                summary: "Log in an admin user",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/LoginRequest" },
                        },
                    },
                },
                responses: {
                    "200": {
                        description: "Login successful",
                        content: { "application/json": { schema: { $ref: "#/components/schemas/LoginResponse" } } },
                    },
                    "401": {
                        description: "Invalid credentials",
                        content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
                    },
                },
            },
        },
        "/api/tours": {
            get: {
                tags: ["Tours"],
                summary: "List tours",
                parameters: [
                    {
                        name: "search",
                        in: "query",
                        required: false,
                        schema: { type: "string" },
                    },
                ],
                responses: {
                    "200": {
                        description: "Tours returned",
                        content: {
                            "application/json": {
                                schema: apiResponse({ type: "array", items: { $ref: "#/components/schemas/Tour" } }),
                            },
                        },
                    },
                },
            },
            post: {
                tags: ["Tours"],
                summary: "Create a tour",
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "multipart/form-data": {
                            schema: { $ref: "#/components/schemas/TourInput" },
                        },
                    },
                },
                responses: {
                    "201": {
                        description: "Tour created",
                        content: { "application/json": { schema: apiResponse({ $ref: "#/components/schemas/Tour" }) } },
                    },
                    "400": {
                        description: "Validation or duplicate slug error",
                        content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
                    },
                    "401": {
                        description: "Missing or invalid token",
                        content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
                    },
                },
            },
        },
        "/api/tours/{slug}": {
            get: {
                tags: ["Tours"],
                summary: "Get a tour by slug",
                parameters: [idParam("slug", "Tour slug")],
                responses: {
                    "200": {
                        description: "Tour returned",
                        content: { "application/json": { schema: apiResponse({ $ref: "#/components/schemas/Tour" }) } },
                    },
                    "404": {
                        description: "Tour not found",
                        content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
                    },
                },
            },
            patch: {
                tags: ["Tours"],
                summary: "Update a tour by slug",
                security: [{ bearerAuth: [] }],
                parameters: [idParam("slug", "Tour slug")],
                requestBody: {
                    required: true,
                    content: {
                        "multipart/form-data": {
                            schema: { $ref: "#/components/schemas/TourUpdateInput" },
                        },
                    },
                },
                responses: {
                    "200": {
                        description: "Tour updated",
                        content: { "application/json": { schema: apiResponse({ $ref: "#/components/schemas/Tour" }) } },
                    },
                    "401": {
                        description: "Missing or invalid token",
                        content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
                    },
                },
            },
            delete: {
                tags: ["Tours"],
                summary: "Delete a tour by slug",
                security: [{ bearerAuth: [] }],
                parameters: [idParam("slug", "Tour slug")],
                responses: {
                    "200": {
                        description: "Tour deleted",
                        content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
                    },
                    "404": {
                        description: "Tour not found",
                        content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
                    },
                },
            },
        },
        "/api/inquiries": {
            post: {
                tags: ["Inquiries"],
                summary: "Submit an inquiry",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/InquiryInput" },
                        },
                    },
                },
                responses: {
                    "201": {
                        description: "Inquiry created",
                        content: { "application/json": { schema: apiResponse({ $ref: "#/components/schemas/Inquiry" }) } },
                    },
                    "400": {
                        description: "Invalid inquiry data",
                        content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
                    },
                },
            },
            get: {
                tags: ["Inquiries"],
                summary: "List inquiries",
                security: [{ bearerAuth: [] }],
                responses: {
                    "200": {
                        description: "Inquiries returned",
                        content: {
                            "application/json": {
                                schema: apiResponse({ type: "array", items: { $ref: "#/components/schemas/Inquiry" } }),
                            },
                        },
                    },
                    "401": {
                        description: "Missing or invalid token",
                        content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
                    },
                },
            },
        },
        "/api/inquiries/{id}": {
            get: {
                tags: ["Inquiries"],
                summary: "Get an inquiry by ID",
                security: [{ bearerAuth: [] }],
                parameters: [idParam("id", "Inquiry ID")],
                responses: {
                    "200": {
                        description: "Inquiry returned",
                        content: { "application/json": { schema: apiResponse({ $ref: "#/components/schemas/Inquiry" }) } },
                    },
                    "404": {
                        description: "Inquiry not found",
                        content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
                    },
                },
            },
            patch: {
                tags: ["Inquiries"],
                summary: "Update an inquiry by ID",
                security: [{ bearerAuth: [] }],
                parameters: [idParam("id", "Inquiry ID")],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/InquiryUpdateInput" },
                        },
                    },
                },
                responses: {
                    "200": {
                        description: "Inquiry updated",
                        content: { "application/json": { schema: apiResponse({ $ref: "#/components/schemas/Inquiry" }) } },
                    },
                    "404": {
                        description: "Inquiry not found",
                        content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
                    },
                },
            },
            delete: {
                tags: ["Inquiries"],
                summary: "Delete an inquiry by ID",
                security: [{ bearerAuth: [] }],
                parameters: [idParam("id", "Inquiry ID")],
                responses: {
                    "200": {
                        description: "Inquiry deleted",
                        content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
                    },
                    "404": {
                        description: "Inquiry not found",
                        content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
                    },
                },
            },
        },
        "/api/admin/dashboard/sources": {
            get: {
                tags: ["Inquiries"],
                summary: "Get source attribution summaries for the admin dashboard",
                security: [{ bearerAuth: [] }],
                responses: {
                    "200": {
                        description: "Source summaries returned",
                        content: {
                            "application/json": {
                                schema: apiResponse({
                                    type: "object",
                                    properties: {
                                        bookingsBySource: { type: "array", items: { type: "object" } },
                                        inquiriesBySource: { type: "array", items: { type: "object" } },
                                        revenueBySource: { type: "array", items: { type: "object" } },
                                        topCampaigns: { type: "array", items: { type: "object" } },
                                    },
                                }),
                            },
                        },
                    },
                },
            },
        },
        "/api/blogs": {
            get: {
                tags: ["Blogs"],
                summary: "List blog posts",
                responses: {
                    "200": {
                        description: "Published blog posts returned",
                        content: {
                            "application/json": {
                                schema: apiResponse({ type: "array", items: { $ref: "#/components/schemas/BlogPost" } }),
                            },
                        },
                    },
                },
            },
        },
        "/api/blogs/{id}": {
            get: {
                tags: ["Blogs"],
                summary: "Get a blog post by ID",
                parameters: [idParam("id", "Blog post ID")],
                responses: {
                    "200": {
                        description: "Blog post returned",
                        content: { "application/json": { schema: apiResponse({ $ref: "#/components/schemas/BlogPost" }) } },
                    },
                    "404": {
                        description: "Blog post not found",
                        content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
                    },
                },
            },
        },
        "/api/admin/blogs": {
            get: {
                tags: ["Admin Blogs"],
                summary: "List all blog posts",
                security: [{ bearerAuth: [] }],
                responses: {
                    "200": {
                        description: "Blog posts returned",
                        content: {
                            "application/json": {
                                schema: apiResponse({ type: "array", items: { $ref: "#/components/schemas/BlogPost" } }),
                            },
                        },
                    },
                },
            },
            post: {
                tags: ["Admin Blogs"],
                summary: "Create a blog post",
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "multipart/form-data": {
                            schema: { $ref: "#/components/schemas/BlogPostInput" },
                        },
                    },
                },
                responses: {
                    "201": {
                        description: "Blog post created",
                        content: { "application/json": { schema: apiResponse({ $ref: "#/components/schemas/BlogPost" }) } },
                    },
                    "400": {
                        description: "Validation or duplicate slug error",
                        content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
                    },
                },
            },
        },
        "/api/admin/blogs/{id}": {
            get: {
                tags: ["Admin Blogs"],
                summary: "Get any blog post by ID",
                security: [{ bearerAuth: [] }],
                parameters: [idParam("id", "Blog post ID")],
                responses: {
                    "200": {
                        description: "Blog post returned",
                        content: { "application/json": { schema: apiResponse({ $ref: "#/components/schemas/BlogPost" }) } },
                    },
                    "404": {
                        description: "Blog post not found",
                        content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
                    },
                },
            },
            patch: {
                tags: ["Admin Blogs"],
                summary: "Update a blog post by ID",
                security: [{ bearerAuth: [] }],
                parameters: [idParam("id", "Blog post ID")],
                requestBody: {
                    required: true,
                    content: {
                        "multipart/form-data": {
                            schema: { $ref: "#/components/schemas/BlogPostUpdateInput" },
                        },
                    },
                },
                responses: {
                    "200": {
                        description: "Blog post updated",
                        content: { "application/json": { schema: apiResponse({ $ref: "#/components/schemas/BlogPost" }) } },
                    },
                    "404": {
                        description: "Blog post not found",
                        content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
                    },
                },
            },
            delete: {
                tags: ["Admin Blogs"],
                summary: "Delete a blog post by ID",
                security: [{ bearerAuth: [] }],
                parameters: [idParam("id", "Blog post ID")],
                responses: {
                    "200": {
                        description: "Blog post deleted",
                        content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
                    },
                    "404": {
                        description: "Blog post not found",
                        content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
                    },
                },
            },
        },
    },
} as const;
