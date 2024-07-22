import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";
import { version } from "../../package.json";

/**
 *
 * @type {swaggerJsdoc.Options} options
 */
const options = {
  definitions: {
    openapi: "3.0.0",
    info: {
      title: "Banking Rest Api Docs",
      version,
    },
    components: {
      securitySchemas: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["../routes/*"],
};
