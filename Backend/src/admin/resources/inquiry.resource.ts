import type { ResourceWithOptions } from "adminjs";
import { getModelByName } from "@adminjs/prisma";
import { prisma } from "../../config/database.js";

export const inquiryResource: ResourceWithOptions = {
  resource: {
    model: getModelByName("Inquiry"),
    client: prisma,
  },
  options: {
    navigation: {
      name: "Leads",
      icon: "Mail",
    },

    listProperties: [
      "name",
      "email",
      "phone",
      "type",
      "createdAt",
    ],

    showProperties: [
      "type",
      "name",
      "email",
      "phone",
      "message",
      "locale",
      "utmSource",
      "utmMedium",
      "utmCampaign",
      "tourId",
      "createdAt",
    ],

    editProperties: [],

    properties: {
      name: {
        isTitle: true,
      },
      message: {
        type: "textarea",
      },
      createdAt: {
        isVisible: {
          list: true,
          filter: true,
          show: true,
          edit: false,
        },
      },
    },

    actions: {
      new: {
        isAccessible: false,
      },
      delete: {
        isAccessible: false,
      },
    },
  },
};
