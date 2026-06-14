import type { ResourceWithOptions } from "adminjs";
import { getModelByName } from "@adminjs/prisma";
import { prisma } from "../../config/database.js";

export const pageResource: ResourceWithOptions = {
  resource: {
    model: getModelByName("Page"),
    client: prisma,
  },
  options: {
    navigation: {
      name: "Content",
      icon: "FileText",
    },
    properties: {
      content: {
        type: "textarea",
      },
    },
  },
};
