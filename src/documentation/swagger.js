import swaggerUi from "swagger-ui-express";
// import swaggerJsdoc from "swagger-jsdoc";
import swaggerAutoGen from 'swagger-autogen'

const endpoints = ["../routes/*.js"]
const outputFile = './docs.json';

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
    tags:[],
    host:'http://localhost:5010/api/v1',
    schemes:["http", 'https']
  },
  apis: ["../routes.js", "../validation/**/**/*.js"],
};

// export const swaggerSpec = swaggerJsdoc(options);
export { swaggerUi };

swaggerAutoGen(outputFile, endpoints, options);