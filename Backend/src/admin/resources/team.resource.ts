import type { ResourceWithOptions } from "adminjs";
import { getModelByName } from "@adminjs/prisma";
import { prisma } from "../../config/database.js";

export const teamResource: ResourceWithOptions = {
  resource: {
    model: getModelByName("Team"),
    client: prisma,
  },
  options: {
    navigation: {
      name: "Website Content",
      icon: "Users",
    },
    listProperties: ["name", "role", "imageUrl"],
    showProperties: ["name", "role", "imageUrl", "createdAt", "updatedAt"],
    editProperties: ["name", "role", "imageUrl"],
  },
};
