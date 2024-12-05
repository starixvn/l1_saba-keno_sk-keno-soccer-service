import { stub, stubMongooseModelStupidly } from "jest-micro-auto-stub";
import mongoose from "mongoose";
import { helpers, logger } from "sc-common";
import { Core } from "sc-game-base";
import BaseMetrics from "sc-game-base/src/core/base-metrics";

import { choices, choicesMapper } from "../../../src/constants";
import { GameData } from "../../../src/game-data";
import { ProcessBetQueue } from "../../../src/crons/process-bet-queue";

describe("process bet queue instance", () => {
    const definition = {
        id: 1511,
        name: "KenoMatch1",
        durations: {
            wholeRound: 77,
            firstHalfPlacingBets: 69,
            firstHalfLockingBet: 39,
            finishFirstHalf: 34,
            placingBets: 25,
            lockingBet: 5,
        },
        choices,
        choicesMapper,
        defaultBetTracks: {},
    };

    const gameData = new GameData(0);

    /** @type {Core.BaseEventPublishers.BaseEventPublisher}*/
    const placeBetPublisher = stub(Core.BaseEventPublishers.PlaceBetPublisher);

    const placeBet = jest.fn();

    /** @type {logger}*/
    const logService = stub(logger);

    /** @type {mongoose.Model}*/
    const betsRepository = stubMongooseModelStupidly(mongoose.Model);
    betsRepository.updateOne = jest.fn();

    /** @type {mongoose.Model}*/
    const betLogsRepository = stubMongooseModelStupidly(mongoose.Model);
    betLogsRepository.create = jest.fn();

    /** @type {mongoose.Model}*/
    const userInfosRepository = stubMongooseModelStupidly(mongoose.Model);
    userInfosRepository.updateOne = jest.fn();

    const baseMetrics = stub(BaseMetrics);

    const processBetQueue = new ProcessBetQueue({
        definition,
        gameData,
        placeBetPublisher,
        placeBet,
        logService,
        betsRepository,
        betLogsRepository,
        userInfosRepository,
        baseMetrics,
    });

    it("should be instance of Core.Crons.ProcessBetQueue", () => {
        expect(processBetQueue instanceof Core.Crons.ProcessBetQueue).toBeTruthy();
    });

    describe("composeBettingTimeValidationCriteria tests", () => {
        beforeEach(() => {
            gameData.remainingTime = 0;
            gameData.roundId = 1;
            gameData.gameConfigs = { enabled: true };
        });

        it("should return invalidBet notice when round id is different with running round", () => {
            // arrange
            gameData.roundId = 2;

            // act
            var actualResult = processBetQueue.composeBettingTimeValidationCriteria(1);

            // assert
            expect(actualResult.filter((x) => x.failure)[0]).toStrictEqual({
                failure: true,
                notice: { errorCode: helpers.noticeHelper.placeBetNextRound },
            });
        });

        [70, 38, 4].forEach((remainingTime) => {
            it(`should return placeBetNextRound when placing bet in invalid time (${remainingTime})`, () => {
                // arrange
                gameData.remainingTime = remainingTime;

                // act
                var actualResult = processBetQueue.composeBettingTimeValidationCriteria(1);

                // assert
                expect(actualResult.filter((x) => x.failure)[0]).toStrictEqual({
                    failure: true,
                    notice: { errorCode: helpers.noticeHelper.placeBetNextRound },
                });
            });
        });

        [50, 15].forEach((remainingTime) => {
            it(`should not return any notice when placing bet in valid time (${remainingTime})`, () => {
                // arrange
                gameData.remainingTime = remainingTime;

                // act
                var actualResult = processBetQueue.composeBettingTimeValidationCriteria(1);

                // assert
                expect(actualResult.filter((x) => x.failure).length).toBe(0);
            });
        });
    });
});
