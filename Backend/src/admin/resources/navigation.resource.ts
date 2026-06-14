import type { ResourceWithOptions } from "adminjs";
import { getModelByName } from "@adminjs/prisma";
import { prisma } from "../../config/database.js";

const createSlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const navigationResource: ResourceWithOptions = {
  resource: {
    model: getModelByName("NavigationItem"),
    client: prisma,
  },
  options: {
    navigation: {
      name: "Website Content",
      icon: "Menu",
    },

    listProperties: [
      "label",
      "url",
      "location",
      "order",
      "isVisible",
      "isExternal",
    ],

    showProperties: [
      "label",
      "slug",
      "url",
      "location",
      "order",
      "isVisible",
      "isExternal",
      "createdAt",
      "updatedAt",
    ],

    editProperties: [
      "label",
      "slug",
      "url",
      "location",
      "order",
      "isVisible",
      "isExternal",
    ],

    properties: {
      label: {
        isTitle: true,
      },
      slug: {
        description: "Auto-generated from label if left empty.",
      },
      url: {
        description: "Example: /experiences or https://instagram.com/...",
      },
      location: {
        availableValues: [
          { value: "HOME_NAVBAR", label: "Home Navbar" },
          { value: "FOOTER", label: "Footer" },
        ],
      },
      order: {
        description: "Lower number appears first.",
      },
      createdAt: {
        isVisible: {
          list: false,
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
          if (request.payload?.label && !request.payload?.slug) {
            request.payload.slug = createSlug(request.payload.label);
          }

          return request;
        },
      },

      edit: {
        before: async (request) => {
          if (request.payload?.label && !request.payload?.slug) {
            request.payload.slug = createSlug(request.payload.label);
          }

          return request;
        },
      },
    },
  },
};
