const { secure } = require("./cookie.config");

const { SwaggerTheme, SwaggerThemeNameEnum } = require("swagger-themes");

const theme = new SwaggerTheme();

// unused code
const swaggerOptions = {
	explorer: true,
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
		customCss: theme.getBuffer(SwaggerThemeNameEnum.DARK),
	},
	apis: ["./src/routes/*.js", "./src/models/*.js"],
};

module.exports = swaggerOptions;
