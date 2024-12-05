import mongoose from "mongoose";
import { GameDefinition } from "sc-multiple-games-base";

import { GameData } from "../game-data";
import { sumArrayNumber } from "../helpers/array-helper";
import { createHashMD5, randomString, encrypt } from "../helpers/crypto-helper";
import { RoundResultPublisher } from "../publishers";

export class RoundResultConsumer {
    /**
     * @param {GameData} gameData
     * @param {GameDefinition} definition
     *  @param {mongoose.Model} globalConfigsRepository
     * @param {mongoose.Model} roundsRepository
     * @param {RoundResultPublisher} roundResultPublisher
     */
    constructor(gameData, definition, globalConfigsRepository, roundsRepository, roundResultPublisher) {
        this.gameData = gameData;
        this.definition = definition;
        this.globalConfigsRepository = globalConfigsRepository;
        this.roundsRepository = roundsRepository;
        this.roundResultPublisher = roundResultPublisher;
    }

    async generateFirstHalfResult() {
        const resultFromAdmin = this.gameData.settlementResultFromAdmin;
        const { roundId, exchangeRates, gameConfigs } = this.gameData;
        const { randomMode } = gameConfigs;
        const { generateResult, settle } = this.definition;

        const result =
            roundId === resultFromAdmin.roundId
                ? resultFromAdmin.result.firstHalf.result
                : { blue: generateResult(randomMode), red: generateResult(randomMode) };

        const totalBlue = sumArrayNumber(result.blue);
        const totalRed = sumArrayNumber(result.red);
        const sum = totalBlue + totalRed;
        const settlementResult = settle({ totalBlue, totalRed }, true);

        const liveOdds = await this.globalConfigsRepository.findOne({ type: "kenosoccer_liveodds" }, "blueRed overUnder").lean().exec();
        this.gameData.liveOdds = { ...liveOdds.blueRed[totalBlue - totalRed], ...liveOdds.overUnder[sum] };
        const odds = { ...this.gameData.gameConfigs.odds, ...this.gameData.liveOdds };

        const resultKey = `{${totalBlue};${totalRed}}_{#${roundId}${randomString()}}`;
        const md5 = createHashMD5(resultKey);

        await this.roundsRepository.create({
            id: roundId,
            odds,
            firstHalf: { md5, resultKey: encrypt(resultKey), encryptedResult: encrypt(JSON.stringify(result)), time: new Date() },
            time: new Date(),
            exchangeRateId: exchangeRates.exId,
        });

        this.gameData.currentMD5 = md5;
        this.gameData.firstHalfResult = { result, settlementResult, totalRed, totalBlue, resultKey, roundId };
        this.roundResultPublisher.publishMD5(md5);
    }

    handleFinishFistHalf() {
        const { firstHalfResult, liveOdds } = this.gameData;
        this.roundResultPublisher.publishFirstHalfResult(firstHalfResult);
        this.roundResultPublisher.publishToAllUsers({ liveOdds });
    }

    async generateFullTimeResult() {
        const { roundId, firstHalfResult, settlementResultFromAdmin: resultFromAdmin, gameConfigs } = this.gameData;
        const { randomMode } = gameConfigs;
        const result = firstHalfResult.result;
        const { generateResult } = this.definition;

        const fullTimeResult =
            roundId === resultFromAdmin.roundId
                ? resultFromAdmin.result.fullTime.result
                : {
                      blue: generateResult(randomMode, result?.blue),
                      red: generateResult(randomMode, result?.red),
                  };

        const totalBlue = sumArrayNumber(fullTimeResult.blue) + firstHalfResult.totalBlue;
        const totalRed = sumArrayNumber(fullTimeResult.red) + firstHalfResult.totalRed;
        const resultKey = `{${totalBlue};${totalRed}}_{#${roundId}${randomString()}}`;
        const md5 = createHashMD5(resultKey);
        this.gameData.currentMD5 = md5;
        const update = {
            fullTime: {
                md5,
                resultKey: encrypt(resultKey),
                encryptedResult: encrypt(JSON.stringify(fullTimeResult)),
                time: new Date(),
            },
            "firstHalf.result": firstHalfResult.result,
            "firstHalf.settlementResult": firstHalfResult.settlementResult,
            "firstHalf.sum": firstHalfResult.totalBlue + firstHalfResult.totalRed,
        };
        await this.roundsRepository.updateOne(
            {
                id: roundId,
            },
            update
        );

        this.roundResultPublisher.publishMD5(md5);
    }
}
