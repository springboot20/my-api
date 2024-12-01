import swaggerJsdoc from "swagger-jsdoc";
import { join, dirname } from "path";
import * as url from "url";

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * @type {swaggerJsdoc.Options} options
 */
const options = {
  definition: {
    openapi: "3.1.0",
    info: {
      title: "Banking Rest Api Docs",
      version: "0.1.0",
      description: "",
      license: {
        name: "MIT",
        url: "https://spdx.org/licenses/MIT.html",
      },
      contact: {
        name: "CodeSuite",
        url: "https://github.com/springboot20",
        email: "opeyemiakanbi328@email.com",
      },
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
    servers: [
      {
        url: "http://localhost:5010/api/v1",
      },
    ],
  },
  apis: [join(__dirname, "../routes/**/*.js"), join(__dirname, "../validation/**/*.js")],
};

export const specs = swaggerJsdoc(options);
