const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Chatbot Mock API',
            version: '1.0.0',
            description: 'Temporary express API for chatbot frontend',
        },
        servers: [
            {
                url: 'http://localhost:5050',
                description: 'Local server',
            },
        ],
    },
    apis: ['./index.js'], // Use annotations in index.js
};

const specs = swaggerJsDoc(options);

module.exports = {
    swaggerUi,
    specs,
};
