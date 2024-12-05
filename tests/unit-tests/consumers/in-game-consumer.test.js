import { stub, stubMongooseModelStupidly } from "jest-micro-auto-stub";
import mongoose from "mongoose";
import { Core } from "sc-game-base";

import { choices, choicesMapper } from "../../../src/constants";
import { InGameConsumer } from "../../../src/consumers";
import { GameData } from "../../../src/game-data";
import { RoundQuery } from "../../../src/query-apis";

describe("in game consumer instance", () => {
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

    /** @type {mongoose.Model}*/
    const userInfosRepository = stubMongooseModelStupidly(mongoose.Model);
    const roundQuery = stub(RoundQuery);
    const publisher = stub(Core.BaseEventPublishers.BaseEventPublisher);
    const getBalance = jest.fn();
    const realPlayer = {
        socketClient: {
            emit: jest.fn(),
        },
        profile: {
            name: "player01",
        },
    };

    const consumer = new InGameConsumer(definition, gameData, roundQuery, publisher, getBalance, userInfosRepository);

    it("should be instance of Core.BaseEventConsumers.InGameConsumer", () => {
        expect(consumer instanceof Core.BaseEventConsumers.InGameConsumer).toBeTruthy();
    });

    describe("buildPayload tests", () => {
        const basePayload = { roundId: 1, gameConfigs: {}, roundHistory: [], ownBets: {}, totalBets: {}, user: {} };
        beforeEach(() => {
            spyOn(Core.BaseEventConsumers.InGameConsumer.prototype, "buildPayload").and.callFake(() => basePayload);
        });

        it("should call super.buildPayload", async () => {
            // act
            await consumer.buildPayload(realPlayer);

            // assert
            expect(Core.BaseEventConsumers.InGameConsumer.prototype.buildPayload).toHaveBeenCalled();
        });

        it("should return correct result when remaining time less than or equal finish first half", async () => {
            // arrange
            const liveOdds = { liveFTBlue: 2.1, liveFTRed: 1.5 };
            const firstHalfResult = {
                result: { blue: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], red: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
                settlementResult: {},
                resultKey: "resultKey",
            };
            gameData.remainingTime = definition.durations.finishFirstHalf - 1;
            gameData.liveOdds = liveOdds;
            gameData.firstHalfResult = firstHalfResult;
            gameData.currentMD5 = "md5hash";
            const expectedResult = { ...basePayload, firstHalfResult, liveOdds, md5: "md5hash" };

            // act
            const actualResult = await consumer.buildPayload(realPlayer);

            // assert
            expect(actualResult).toStrictEqual(expectedResult);
        });

        it("should return correct result when remaining time greater than finish first half", async () => {
            // arrange
            const liveOdds = { liveFTBlue: 2.1, liveFTRed: 1.5 };
            const firstHalfResult = {
                result: { blue: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], red: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
                settlementResult: {},
                resultKey: "resultKey",
            };
            gameData.remainingTime = definition.durations.firstHalfLockingBet;
            gameData.liveOdds = liveOdds;
            gameData.firstHalfResult = firstHalfResult;
            gameData.currentMD5 = "md5hash";
            const expectedResult = {
                ...basePayload,
                md5: "md5hash",
            };

            // act
            const actualResult = await consumer.buildPayload(realPlayer);

            // assert
            expect(actualResult).toStrictEqual(expectedResult);
        });
    });
});
