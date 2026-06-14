import type { ResourceWithOptions } from "adminjs";
import { getModelByName } from "@adminjs/prisma";
import { prisma } from "../../config/database.js";

const createSlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const tourResource: ResourceWithOptions = {
  resource: {
    model: getModelByName("Tour"),
    client: prisma,
  },
  options: {
    navigation: {
      name: "Website Content",
      icon: "Map",
    },

    listProperties: [
      "title",
      "slug",
      "region",
      "priceFrom",
      "duration",
      "isPublished",
      "createdAt",
    ],

    showProperties: [
      "title",
      "slug",
      "region",
      "summary",
      "content",
      "priceFrom",
      "duration",
      "photoUrl",
      "isPublished",
      "createdAt",
      "updatedAt",
    ],

    editProperties: [
      "title",
      "slug",
      "region",
      "summary",
      "content",
      "priceFrom",
      "duration",
      "photoUrl",
      "isPublished",
    ],

    properties: {
      title: {
        isTitle: true,
      },
      slug: {
        description: "Auto-generated from title if left empty.",
      },
      summary: {
        type: "textarea",
      },
      content: {
        type: "richtext",
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
          if (request.payload?.title && !request.payload?.slug) {
            request.payload.slug = createSlug(request.payload.title);
          }

          return request;
        },
      },

      edit: {
        before: async (request) => {
          if (request.payload?.title && !request.payload?.slug) {
            request.payload.slug = createSlug(request.payload.title);
          }

          return request;
        },
      },
    },
  },
};
