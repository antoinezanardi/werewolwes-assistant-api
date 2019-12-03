const Error = require("../classes/Error");
const Config = require("../../config");

exports.generateError = (errorType, error) => {
    if (typeof error === "string") {
        error = [{ msg: error }];
    }
    if (!Array.isArray(error)) {
        error = [error];
    }
    return new Error(errorType, error);
};

exports.sendUniqueViolationError = (res, e) => {
    const myRegexp = new RegExp(`${Config.db.name}.([a-z]+)`);
    const match = myRegexp.exec(e.toString());
    if (match[1] === "users") {
        res.status(400).json(this.generateError("EMAIL_EXISTS", e.toString()));
    } else {
        res.status(500).json(this.generateError("INTERNAL_SERVER_ERROR", e.toString()));
    }
};

exports.sendError = (res, e) => {
    if (e && res.headersSent) {
        console.log(e);
    } else if (e && e.response && e.response.data && e.response.data.statusCode) {
        res.status(e.response.data.statusCode).json(this.generateError(e.response.data.type, e.response.data.error || e.response.data.errors));
    } else if (e && e instanceof Error) {
        res.status(e.statusCode).json(e);
    } else if (e && e.code === 11000) {
        this.sendUniqueViolationError(res, e);
    } else if (e && e.constructor && e.constructor.name === "JsonWebTokenError") {
        res.status(401).json(this.generateError("UNAUTHORIZED", e.toString()));
    } else if (e) {
        res.status(500).json(this.generateError("INTERNAL_SERVER_ERROR", e.toString()));
    }
};