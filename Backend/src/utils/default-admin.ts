import bcrypt from "bcrypt";
import { permissions } from "../config/permissions.js";
import { prisma } from "../config/database.js";
import { env } from "../config/env.js";

function defaultUsername() {
    if (env.ADMIN_USERNAME) return env.ADMIN_USERNAME;
    return env.ADMIN_EMAIL.split("@")[0].toLowerCase().replace(/[^a-z0-9_]+/g, "_");
}

export async function createDefaultAdmin() {
    const username = defaultUsername();

    for (const permission of permissions) {
        await prisma.permission.upsert({
            where: { key: permission.key },
            update: { name: permission.name },
            create: permission,
        });
    }

    const allPermissions = await prisma.permission.findMany({
        select: { id: true },
    });

    const existingAdmin = await prisma.user.findFirst({
        where: {
            OR: [
                { username },
                { email: env.ADMIN_EMAIL },
            ],
        },
        include: { userPermissions: true },
    });

    const hashedPassword = await bcrypt.hash(env.ADMIN_PASSWORD, 12);

    if (existingAdmin) {
        const passwordMatches = await bcrypt.compare(env.ADMIN_PASSWORD, existingAdmin.passwordHash);

        if (!passwordMatches || existingAdmin.role !== "SUPER_ADMIN" || existingAdmin.status !== "ACTIVE" || existingAdmin.username !== username) {
            await prisma.user.update({
                where: { id: existingAdmin.id },
                data: {
                    username,
                    email: env.ADMIN_EMAIL,
                    passwordHash: passwordMatches ? existingAdmin.passwordHash : hashedPassword,
                    role: "SUPER_ADMIN",
                    status: "ACTIVE",
                },
            });
        }

        const existingPermissionIds = new Set(existingAdmin.userPermissions.map((item) => item.permissionId));
        const missingPermissions = allPermissions.filter((permission) => !existingPermissionIds.has(permission.id));

        if (missingPermissions.length) {
            await prisma.userPermission.createMany({
                data: missingPermissions.map((permission) => ({
                    userId: existingAdmin.id,
                    permissionId: permission.id,
                })),
                skipDuplicates: true,
            });
        }

        return;
    }

    const admin = await prisma.user.create({
        data: {
            name: "Admin",
            username,
            email: env.ADMIN_EMAIL,
            passwordHash: hashedPassword,
            role: "SUPER_ADMIN",
            status: "ACTIVE",
        },
    });

    await prisma.userPermission.createMany({
        data: allPermissions.map((permission) => ({
            userId: admin.id,
            permissionId: permission.id,
        })),
        skipDuplicates: true,
    });
}
