import type { ResourceWithOptions } from "adminjs";
import bcrypt from "bcrypt";
import { getModelByName } from "@adminjs/prisma";
import { prisma } from "../../config/database.js";

export const userResource: ResourceWithOptions = {
  resource: {
    model: getModelByName("User"),
    client: prisma,
  },
  options: {
    navigation: {
      name: "Admin",
      icon: "User",
    },

    listProperties: ["email", "name", "role", "createdAt"],

    showProperties: ["email", "name", "role", "createdAt", "updatedAt"],

    editProperties: ["email", "name", "role", "passwordHash"],

    properties: {
      email: {
        isTitle: true,
      },
      passwordHash: {
        type: "password",
        isVisible: {
          list: false,
          filter: false,
          show: false,
          edit: true,
        },
      },
      createdAt: {
        isVisible: {
          list: true,
          filter: true,
          show: true,
          edit: false,
        },
      },
      updatedAt: {
        isVisible: {
          list: false,
          filter: true,
          show: true,
          edit: false,
        },
      },
    },

    actions: {
      new: {
        before: async (request) => {
          if (request.payload?.passwordHash) {
            request.payload.passwordHash = await bcrypt.hash(
              request.payload.passwordHash,
              12
            );
          }

          return request;
        },
      },

      edit: {
        before: async (request) => {
          if (request.payload?.passwordHash) {
            request.payload.passwordHash = await bcrypt.hash(
              request.payload.passwordHash,
              12
            );
          } else {
            delete request.payload?.passwordHash;
          }

          return request;
        },
      },
    },
  },
};
