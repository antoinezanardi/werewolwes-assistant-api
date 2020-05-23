const GameHistory = require("../db/models/GameHistory");

exports.find = async(search, projection, options = {}) => await GameHistory.find(search, projection, options);

exports.findOne = async(search, projection, options = {}) => await GameHistory.findOne(search, projection, options);

exports.create = async(data, options = {}) => {
    const { toJSON } = options;
    delete options.toJSON;
    if (!Array.isArray(data)) {
        options = null;
    }
    const gameHistoryEntry = await GameHistory.create(data, options);
    return toJSON ? gameHistoryEntry.toJSON() : gameHistoryEntry;
};