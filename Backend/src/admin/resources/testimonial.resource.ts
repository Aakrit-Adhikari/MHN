import type { ResourceWithOptions } from "adminjs";
import { getModelByName } from "@adminjs/prisma";
import { prisma } from "../../config/database.js";

export const testimonialResource: ResourceWithOptions = {
  resource: {
    model: getModelByName("Testimonial"),
    client: prisma,
  },
  options: {
    navigation: {
      name: "Website Content",
      icon: "MessageSquare",
    },
    listProperties: ["customerName", "source", "date"],
    showProperties: ["customerName", "quote", "source", "date", "createdAt", "updatedAt"],
    editProperties: ["customerName", "quote", "source", "date"],
    properties: {
      quote: {
        type: "textarea",
      },
    },
  },
};
