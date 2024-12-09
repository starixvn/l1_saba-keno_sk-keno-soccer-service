import mongoose from "mongoose";
import { users } from "sc-base-database";
import { middlewares } from "sc-common";
import {
    createCurrencyGroupGames,
    createDummyCurrency,
    createDummyUsers,
    createExchangeRate,
    createGameConfig,
    createPartnerConfig,
    normalUser,
} from "sc-game-service-integration-utils";

import appConfigs from "../../../src/app-configs.IGT";
import kenoSoccerRounds from "../../../src/models/rounds";
import globalConfigs from "../../../src/models/global-configs";
import bets from "../../../src/models/bets";
import { currencyData, game, gameConfig, rounds, userBetData } from "./test-data";
import { globalConfigData } from "./global-config-data";

const connectDatabase = async () => {
    console.log("connect database");
    await middlewares.database.configureDatabase(mongoose, appConfigs.database);

    await clearAllData();
};

const clearAllData = async () => {
    const collections = await mongoose.connection.db.collections();

    for (const collection of collections) {
        await collection.remove();
    }
};

export const createTestData = async () => {
    await connectDatabase();
    await createExchangeRate();
    await createGameConfig(gameConfig);
    const partnerConfig = await createPartnerConfig(game.id);

    const currency = await createDummyCurrency(partnerConfig.partnerId, currencyData.code, currencyData.name);
    await createglobalConfigData();
    await createCurrencyGroupGames(currency.groupId, game.id, gameConfig);
    await createDummyUsers(currency);
    await createRounds();
    await createUserBetData();

    console.log("Create exchange rate, game config & dummy user for testing successfully!");
    process.exit(0);
};

const getUserId = async (playerId) => {
    const user = await users.findOne({ "local.playerId": playerId }, { _id: true }).lean();
    return user._id.toString();
};

const createRounds = async () => {
    try {
        return kenoSoccerRounds("kenosoccer_phiens").insertMany(rounds);
    } catch (error) {
        console.log(error);
    }
};

const createUserBetData = async () => {
    const userId = await getUserId(normalUser.playerId);
    const betData = userBetData(userId);
    return bets("kenosoccer_cuocs").insertMany(betData);
};

const createglobalConfigData = async () => {
    try {
        return globalConfigs.insertMany(globalConfigData);
    } catch (error) {
        console.log(error);
    }
};

createTestData();
