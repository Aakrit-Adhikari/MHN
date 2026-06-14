import AdminJS from "adminjs";
import { Database, Resource } from "@adminjs/prisma";
import { adminResources } from "./admin.resources.js";
import { componentLoader, Components } from "./component-loader.js";

AdminJS.registerAdapter({
  Database,
  Resource,
});

export const admin = new AdminJS({
  rootPath: "/admin",

  componentLoader,

  dashboard: {
    component: Components.Dashboard,
  },

  resources: adminResources,

  branding: {
    companyName: "Mountain Helicopters Nepal",
    logo: false,
   
    withMadeWithLove: false,
  },
});

if (process.env.NODE_ENV !== "production") {
  admin.watch();
}