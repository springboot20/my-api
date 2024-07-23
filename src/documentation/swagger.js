import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";
/**
 * @type {swaggerJsdoc.Options} options
 */
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Banking Rest Api Docs",
      version: "1.0.0",
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
  apis: ["../routes/**/*.js", "../validation/**/*.js"],
};

export const swaggerSpec = swaggerJsdoc(options);
export { swaggerUi };
