const { secure } = require("./cookie.config");

const swaggerOptions = {
  definition: {
    openapi: "3.1.0",
    info: {
      title: "Oneylk API",
      version: "0.1.0",
      description: "This is api documentation for Onelyk Project",
    },
    servers: [
      {
        url: ["http://localhost:8000"],
      },
    ],
  },
  apis: ["./src/routes/*.js", "./src/models/*.js"],
};

module.exports = swaggerOptions;
