require("dotenv").config();

const Config = {
    app: {
        nodeEnv: process.env.NODE_ENV || "production",
        port: process.env.PORT || 4202,
        JWTSecret: process.env.JWT_SECRET || "somethingsecret",
        basicAuth: {
            username: process.env.BASIC_USERNAME,
            password: process.env.BASIC_PASSWORD,
        },
    },
    db: {
        name: process.env.DB_NAME || "distribution",
    },
};

module.exports = Config;