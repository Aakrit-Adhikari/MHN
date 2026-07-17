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
        { name: "Auth", description: "Customer authentication endpoints" },
        { name: "Admin Auth", description: "Admin authentication endpoints" },
        { name: "Tours", description: "Tour listing and admin management" },
        { name: "Inquiries", description: "Customer inquiry submission and admin management" },
        { name: "Blogs", description: "Public blog endpoints" },
        { name: "Admin Blogs", description: "Admin blog management" },
        { name: "Newsletter", description: "Public newsletter subscription endpoints" },
        { name: "Admin Newsletters", description: "Admin newsletter and subscriber management" },
        { name: "Admin Calendar", description: "Admin booking calendar endpoints" },
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
                    email: { type: "string", format: "email", example: "customer@example.com" },
                    password: { type: "string", example: "password123" },
                },
            },
            RegisterRequest: {
                type: "object",
                required: ["name", "email", "password", "confirmPassword"],
                properties: {
                    name: { type: "string", example: "Demo Customer" },
                    email: { type: "string", format: "email", example: "customer@example.com" },
                    password: { type: "string", minLength: 8, example: "password123" },
                    confirmPassword: { type: "string", minLength: 8, example: "password123" },
                },
            },
            OAuthProvider: {
                type: "string",
                enum: ["google", "facebook", "apple"],
            },
            Customer: {
                type: "object",
                properties: {
                    id: { type: "string" },
                    name: { type: "string" },
                    email: { type: "string", format: "email" },
                    avatarUrl: { type: "string", nullable: true },
                    category: { type: "string", enum: ["LEAD", "NEW", "REPEATED", "VIP"] },
                    totalBookings: { type: "integer" },
                    totalSpent: { type: "integer" },
                    lastBookingAt: { type: "string", format: "date-time", nullable: true },
                    createdAt: { type: "string", format: "date-time" },
                },
            },
            CustomerAuthResponse: apiResponse({
                type: "object",
                properties: {
                    token: { type: "string" },
                    customer: { $ref: "#/components/schemas/Customer" },
                },
            }),
            AdminLoginRequest: {
                type: "object",
                required: ["username", "password"],
                properties: {
                    username: { type: "string", example: "admin" },
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
            NewsletterSubscriber: {
                type: "object",
                properties: {
                    id: { type: "string" },
                    email: { type: "string", format: "email" },
                    name: { type: "string", nullable: true },
                    isSubscribed: { type: "boolean" },
                    unsubscribedAt: { type: "string", format: "date-time", nullable: true },
                    createdAt: { type: "string", format: "date-time" },
                    updatedAt: { type: "string", format: "date-time" },
                },
            },
            Newsletter: {
                type: "object",
                properties: {
                    id: { type: "string" },
                    title: { type: "string" },
                    subject: { type: "string" },
                    previewText: { type: "string", nullable: true },
                    contentHtml: { type: "string" },
                    contentText: { type: "string", nullable: true },
                    audienceType: { type: "string", enum: ["ALL_SUBSCRIBERS", "PREMIUM_USERS", "CUSTOM"] },
                    status: { type: "string", enum: ["DRAFT", "SENDING", "SENT", "FAILED"] },
                    sentAt: { type: "string", format: "date-time", nullable: true },
                    createdAt: { type: "string", format: "date-time" },
                    updatedAt: { type: "string", format: "date-time" },
                },
            },
            NewsletterInput: {
                type: "object",
                required: ["title", "subject", "contentHtml"],
                properties: {
                    title: { type: "string", minLength: 3 },
                    subject: { type: "string", minLength: 3 },
                    previewText: { type: "string", nullable: true },
                    contentHtml: { type: "string", minLength: 10 },
                    contentText: { type: "string", nullable: true },
                    audienceType: { type: "string", enum: ["ALL_SUBSCRIBERS", "PREMIUM_USERS", "CUSTOM"] },
                },
            },
            NewsletterSubscribeInput: {
                type: "object",
                required: ["email"],
                properties: {
                    email: { type: "string", format: "email" },
                    name: { type: "string", nullable: true },
                },
            },
            CalendarBooking: {
                type: "object",
                properties: {
                    id: { type: "string" },
                    bookingDate: { type: "string", format: "date-time", nullable: true },
                    tourId: { type: "string", nullable: true },
                    tourSlug: { type: "string", nullable: true },
                    tourTitle: { type: "string" },
                    customerName: { type: "string" },
                    customerPhone: { type: "string", nullable: true },
                    customerEmail: { type: "string", nullable: true },
                    passengerCount: { type: "integer", nullable: true },
                    status: { type: "string", enum: ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"] },
                    amount: { type: "integer", nullable: true },
                    currency: { type: "string" },
                    sourceType: { type: "string", nullable: true },
                    sourceName: { type: "string", nullable: true },
                    notes: { type: "string", nullable: true },
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
        "/api/auth/register": {
            post: {
                tags: ["Auth"],
                summary: "Register a customer with email and password",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/RegisterRequest" },
                        },
                    },
                },
                responses: {
                    "201": {
                        description: "Customer registered",
                        content: { "application/json": { schema: { $ref: "#/components/schemas/CustomerAuthResponse" } } },
                    },
                    "400": {
                        description: "Missing fields or invalid password",
                        content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
                    },
                    "409": {
                        description: "Email is already registered",
                        content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
                    },
                },
            },
        },
        "/api/auth/login": {
            post: {
                tags: ["Auth"],
                summary: "Log in a customer with email and password",
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
                        content: { "application/json": { schema: { $ref: "#/components/schemas/CustomerAuthResponse" } } },
                    },
                    "401": {
                        description: "Invalid credentials",
                        content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
                    },
                },
            },
        },
        "/api/auth/me": {
            get: {
                tags: ["Auth"],
                summary: "Get the currently logged-in customer",
                security: [{ bearerAuth: [] }],
                responses: {
                    "200": {
                        description: "Customer returned",
                        content: { "application/json": { schema: apiResponse({ $ref: "#/components/schemas/Customer" }) } },
                    },
                    "401": {
                        description: "Missing or invalid customer token",
                        content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
                    },
                },
            },
        },
        "/api/auth/oauth/{provider}/start": {
            get: {
                tags: ["Auth"],
                summary: "Start customer OAuth login/signup",
                description: "Redirects to Google, Facebook, or Apple. Apple requires APPLE_CLIENT_ID and APPLE_CLIENT_SECRET in Backend/.env.",
                parameters: [
                    {
                        name: "provider",
                        in: "path",
                        required: true,
                        schema: { $ref: "#/components/schemas/OAuthProvider" },
                    },
                ],
                responses: {
                    "302": { description: "Redirect to OAuth provider" },
                    "400": {
                        description: "Provider credentials are missing",
                        content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
                    },
                    "404": {
                        description: "Unknown OAuth provider",
                        content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
                    },
                },
            },
        },
        "/api/auth/oauth/{provider}/callback": {
            get: {
                tags: ["Auth"],
                summary: "OAuth callback for Google/Facebook and fallback Apple redirects",
                parameters: [
                    {
                        name: "provider",
                        in: "path",
                        required: true,
                        schema: { $ref: "#/components/schemas/OAuthProvider" },
                    },
                    {
                        name: "code",
                        in: "query",
                        required: true,
                        schema: { type: "string" },
                    },
                ],
                responses: {
                    "302": { description: "Redirect to customer app with oauthToken or oauthError" },
                },
            },
            post: {
                tags: ["Auth"],
                summary: "Apple OAuth form_post callback",
                parameters: [
                    {
                        name: "provider",
                        in: "path",
                        required: true,
                        schema: { $ref: "#/components/schemas/OAuthProvider" },
                    },
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/x-www-form-urlencoded": {
                            schema: {
                                type: "object",
                                required: ["code"],
                                properties: {
                                    code: { type: "string" },
                                    user: {
                                        type: "string",
                                        description: "Apple user JSON string, usually only sent on the first authorization.",
                                    },
                                },
                            },
                        },
                    },
                },
                responses: {
                    "302": { description: "Redirect to customer app with oauthToken or oauthError" },
                },
            },
        },
        "/api/auth/oauth/{provider}/mock": {
            post: {
                tags: ["Auth"],
                summary: "Mock customer OAuth login/signup for local testing",
                description: "Works when ALLOW_MOCK_OAUTH=true. Use provider apple to test Apple account creation without real Apple credentials.",
                parameters: [
                    {
                        name: "provider",
                        in: "path",
                        required: true,
                        schema: { $ref: "#/components/schemas/OAuthProvider" },
                    },
                ],
                responses: {
                    "200": {
                        description: "Mock OAuth login successful",
                        content: { "application/json": { schema: { $ref: "#/components/schemas/CustomerAuthResponse" } } },
                    },
                    "403": {
                        description: "Mock OAuth is disabled",
                        content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
                    },
                    "404": {
                        description: "Unknown OAuth provider",
                        content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
                    },
                },
            },
        },
        "/api/admin/auth/login": {
            post: {
                tags: ["Admin Auth"],
                summary: "Log in an admin user",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/AdminLoginRequest" },
                        },
                    },
                },
                responses: {
                    "200": {
                        description: "Admin login successful",
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
        "/api/newsletter/subscribe": {
            post: {
                tags: ["Newsletter"],
                summary: "Subscribe an email address to newsletters",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/NewsletterSubscribeInput" },
                        },
                    },
                },
                responses: {
                    "200": {
                        description: "Subscriber created or re-subscribed",
                        content: { "application/json": { schema: apiResponse({ $ref: "#/components/schemas/NewsletterSubscriber" }) } },
                    },
                },
            },
        },
        "/api/newsletter/unsubscribe": {
            get: {
                tags: ["Newsletter"],
                summary: "Unsubscribe from newsletter emails",
                parameters: [
                    {
                        name: "token",
                        in: "query",
                        required: true,
                        schema: { type: "string" },
                    },
                ],
                responses: {
                    "200": {
                        description: "Subscriber unsubscribed",
                        content: { "application/json": { schema: apiResponse({ $ref: "#/components/schemas/NewsletterSubscriber" }) } },
                    },
                },
            },
        },
        "/api/admin/newsletters": {
            get: {
                tags: ["Admin Newsletters"],
                summary: "List newsletters",
                security: [{ bearerAuth: [] }],
                responses: {
                    "200": {
                        description: "Newsletters returned",
                        content: { "application/json": { schema: apiResponse({ type: "array", items: { $ref: "#/components/schemas/Newsletter" } }) } },
                    },
                },
            },
            post: {
                tags: ["Admin Newsletters"],
                summary: "Create a newsletter draft",
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/NewsletterInput" },
                        },
                    },
                },
                responses: {
                    "201": {
                        description: "Newsletter draft created",
                        content: { "application/json": { schema: apiResponse({ $ref: "#/components/schemas/Newsletter" }) } },
                    },
                },
            },
        },
        "/api/admin/newsletters/subscribers": {
            get: {
                tags: ["Admin Newsletters"],
                summary: "List newsletter subscribers",
                security: [{ bearerAuth: [] }],
                responses: {
                    "200": {
                        description: "Subscribers returned",
                        content: { "application/json": { schema: apiResponse({ type: "array", items: { $ref: "#/components/schemas/NewsletterSubscriber" } }) } },
                    },
                },
            },
            post: {
                tags: ["Admin Newsletters"],
                summary: "Create or re-subscribe a newsletter subscriber",
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/NewsletterSubscribeInput" },
                        },
                    },
                },
                responses: {
                    "201": {
                        description: "Subscriber saved",
                        content: { "application/json": { schema: apiResponse({ $ref: "#/components/schemas/NewsletterSubscriber" }) } },
                    },
                },
            },
        },
        "/api/admin/newsletters/{id}": {
            get: {
                tags: ["Admin Newsletters"],
                summary: "Get a newsletter by ID",
                security: [{ bearerAuth: [] }],
                parameters: [idParam("id", "Newsletter ID")],
                responses: {
                    "200": {
                        description: "Newsletter returned",
                        content: { "application/json": { schema: apiResponse({ $ref: "#/components/schemas/Newsletter" }) } },
                    },
                },
            },
            patch: {
                tags: ["Admin Newsletters"],
                summary: "Update a draft newsletter",
                security: [{ bearerAuth: [] }],
                parameters: [idParam("id", "Newsletter ID")],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/NewsletterInput" },
                        },
                    },
                },
                responses: {
                    "200": {
                        description: "Newsletter updated",
                        content: { "application/json": { schema: apiResponse({ $ref: "#/components/schemas/Newsletter" }) } },
                    },
                },
            },
            delete: {
                tags: ["Admin Newsletters"],
                summary: "Delete a draft newsletter",
                security: [{ bearerAuth: [] }],
                parameters: [idParam("id", "Newsletter ID")],
                responses: {
                    "200": {
                        description: "Newsletter deleted",
                        content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
                    },
                },
            },
        },
        "/api/admin/newsletters/{id}/preview": {
            post: {
                tags: ["Admin Newsletters"],
                summary: "Build a branded newsletter email preview",
                security: [{ bearerAuth: [] }],
                parameters: [idParam("id", "Newsletter ID")],
                responses: {
                    "200": {
                        description: "Email HTML and text returned",
                        content: { "application/json": { schema: apiResponse({ type: "object" }) } },
                    },
                },
            },
        },
        "/api/admin/newsletters/{id}/test-send": {
            post: {
                tags: ["Admin Newsletters"],
                summary: "Prepare a test newsletter email",
                security: [{ bearerAuth: [] }],
                parameters: [idParam("id", "Newsletter ID")],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/NewsletterSubscribeInput" },
                        },
                    },
                },
                responses: {
                    "200": {
                        description: "Test email prepared",
                        content: { "application/json": { schema: apiResponse({ type: "object" }) } },
                    },
                },
            },
        },
        "/api/admin/newsletters/{id}/send": {
            post: {
                tags: ["Admin Newsletters"],
                summary: "Send a draft newsletter to subscribed recipients",
                security: [{ bearerAuth: [] }],
                parameters: [idParam("id", "Newsletter ID")],
                responses: {
                    "200": {
                        description: "Newsletter send completed",
                        content: { "application/json": { schema: apiResponse({ type: "object" }) } },
                    },
                },
            },
        },
        "/api/admin/calendar/bookings": {
            get: {
                tags: ["Admin Calendar"],
                summary: "List bookings for a calendar month or date range",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: "month",
                        in: "query",
                        required: false,
                        schema: { type: "string", example: "2026-06" },
                    },
                    {
                        name: "from",
                        in: "query",
                        required: false,
                        schema: { type: "string", format: "date", example: "2026-06-01" },
                    },
                    {
                        name: "to",
                        in: "query",
                        required: false,
                        schema: { type: "string", format: "date", example: "2026-06-30" },
                    },
                    {
                        name: "tourId",
                        in: "query",
                        required: false,
                        schema: { type: "string" },
                    },
                    {
                        name: "status",
                        in: "query",
                        required: false,
                        schema: { type: "string", enum: ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"] },
                    },
                ],
                responses: {
                    "200": {
                        description: "Calendar bookings returned",
                        content: {
                            "application/json": {
                                schema: apiResponse({ type: "array", items: { $ref: "#/components/schemas/CalendarBooking" } }),
                            },
                        },
                    },
                    "400": {
                        description: "Missing or invalid date range",
                        content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
                    },
                },
            },
        },
        "/api/admin/calendar/summary": {
            get: {
                tags: ["Admin Calendar"],
                summary: "Get calendar booking totals for a month or date range",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: "month",
                        in: "query",
                        required: false,
                        schema: { type: "string", example: "2026-06" },
                    },
                    {
                        name: "from",
                        in: "query",
                        required: false,
                        schema: { type: "string", format: "date" },
                    },
                    {
                        name: "to",
                        in: "query",
                        required: false,
                        schema: { type: "string", format: "date" },
                    },
                ],
                responses: {
                    "200": {
                        description: "Calendar summary returned",
                        content: { "application/json": { schema: apiResponse({ type: "object" }) } },
                    },
                },
            },
        },
        "/api/admin/calendar/tours": {
            get: {
                tags: ["Admin Calendar"],
                summary: "List tours for calendar filters",
                security: [{ bearerAuth: [] }],
                responses: {
                    "200": {
                        description: "Tours returned",
                        content: { "application/json": { schema: apiResponse({ type: "array", items: { $ref: "#/components/schemas/Tour" } }) } },
                    },
                },
            },
        },
    },
} as const;
