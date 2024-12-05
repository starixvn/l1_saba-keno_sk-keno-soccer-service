import { stub, stubMongooseModelStupidly } from "jest-micro-auto-stub";
import mongoose from "mongoose";

import { choices, choicesMapper } from ".../../../src/constants";
import { GameData } from "../../../src/game-data";
import { RoundResultPublisher } from "../../../src/publishers";
import { RoundResultConsumer } from "../../../src/consumers/round-result-consumer";
import { sumArrayNumber } from "../../../src/helpers/array-helper";
import { createHashMD5, randomString, encrypt } from "../../../src/helpers/crypto-helper";
import { when } from "jest-when";

jest.mock("../../../src/helpers/array-helper");
jest.mock("../../../src/helpers/crypto-helper");

describe("Round result consumer instance", () => {
    // arrange
    const mockDate = new Date(123456);
    let spy;
    const definition = {
        id: 1511,
        name: "SkKenoSoccer",
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
    const globalConfigsRepository = stubMongooseModelStupidly(mongoose.Model);

    /** @type {mongoose.Model}*/
    const roundsRepository = stubMongooseModelStupidly(mongoose.Model);

    /** @type {RoundResultPublisher}*/
    const roundResultPublisher = stub(RoundResultPublisher);

    beforeEach(() => {
        gameData.roundId = 1;
        gameData.gameConfigs = { enabled: true };
        gameData.settlementResultFromAdmin = {};
        definition.generateResult = jest.fn(() => [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
        definition.settle = jest.fn();
    });

    beforeAll(() => {
        jest.useFakeTimers();
        spy = jest.spyOn(global, "Date").mockImplementation(() => mockDate);
    });
    afterAll(() => {
        jest.clearAllMocks();
        spy.mockRestore();
    });

    describe("generateFirstHalfResult tests", () => {
        it("should not call generateResult when set result from admin", async () => {
            // arrange
            gameData.roundId = 2;
            gameData.settlementResultFromAdmin = {
                roundId: 2,
                result: {
                    firstHalf: {
                        result: { blue: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], red: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
                    },
                },
            };
            globalConfigsRepository
                .findOne({ type: "kenosoccer_liveodds" }, "blueRed overUnder")
                .lean()
                .exec.mockReturnValueOnce({ blueRed: {}, overUnder: {} });
            const roundResultConsumer = new RoundResultConsumer(
                gameData,
                definition,
                globalConfigsRepository,
                roundsRepository,
                roundResultPublisher
            );

            // act
            await roundResultConsumer.generateFirstHalfResult();

            // assert
            expect(definition.generateResult).not.toHaveBeenCalled();
        });

        it("should call generateResult when not set result from admin", async () => {
            // arrange
            gameData.roundId = 2;
            globalConfigsRepository
                .findOne({ type: "kenosoccer_liveodds" }, "blueRed overUnder")
                .lean()
                .exec.mockReturnValueOnce({ blueRed: {}, overUnder: {} });
            const roundResultConsumer = new RoundResultConsumer(
                gameData,
                definition,
                globalConfigsRepository,
                roundsRepository,
                roundResultPublisher
            );

            // act
            await roundResultConsumer.generateFirstHalfResult();

            // assert
            expect(definition.generateResult).toHaveBeenCalledTimes(2);
            expect(definition.settle).toHaveBeenCalled();
            expect(roundResultPublisher.publishMD5).toHaveBeenCalled();
        });

        it("should call settle result with expected", async () => {
            // arrange
            gameData.roundId = 2;
            globalConfigsRepository
                .findOne({ type: "kenosoccer_liveodds" }, "blueRed overUnder")
                .lean()
                .exec.mockReturnValueOnce({ blueRed: {}, overUnder: {} });
            definition.generateResult.mockReturnValueOnce([1, 2, 3, 4, 5]).mockReturnValueOnce([6, 7, 8, 9, 10]);
            when(sumArrayNumber).calledWith([1, 2, 3, 4, 5]).mockReturnValue(15).calledWith([6, 7, 8, 9, 10]).mockReturnValue(40);
            const roundResultConsumer = new RoundResultConsumer(
                gameData,
                definition,
                globalConfigsRepository,
                roundsRepository,
                roundResultPublisher
            );

            // act
            await roundResultConsumer.generateFirstHalfResult();

            // assert
            expect(definition.settle).toHaveBeenCalledWith({ totalBlue: 15, totalRed: 40 }, true);
        });

        it("should store live odds in game data", async () => {
            // arrange
            gameData.roundId = 2;
            const expectedLiveOdds = {
                liveFTBlue: 1.97,
                liveFTRed: 1.97,
                liveFTOver: 11,
                liveFTUnder: 1.04,
            };
            definition.generateResult.mockReturnValueOnce([1, 2, 3, 4, 5]).mockReturnValueOnce([6, 7, 8, 9, 10]);
            when(sumArrayNumber).calledWith([1, 2, 3, 4, 5]).mockReturnValue(15).calledWith([6, 7, 8, 9, 10]).mockReturnValue(40);
            globalConfigsRepository
                .findOne({ type: "kenosoccer_liveodds" }, "blueRed overUnder")
                .lean()
                .exec.mockReturnValueOnce({
                    blueRed: { [-25]: { liveFTBlue: expectedLiveOdds.liveFTBlue, liveFTRed: expectedLiveOdds.liveFTRed } },
                    overUnder: { 55: { liveFTOver: expectedLiveOdds.liveFTOver, liveFTUnder: expectedLiveOdds.liveFTUnder } },
                });
            const roundResultConsumer = new RoundResultConsumer(
                gameData,
                definition,
                globalConfigsRepository,
                roundsRepository,
                roundResultPublisher
            );

            // act
            await roundResultConsumer.generateFirstHalfResult();

            // assert
            expect(gameData.liveOdds).toStrictEqual(expectedLiveOdds);
        });

        it("should call create hash md5 with expected", async () => {
            // arrange
            gameData.roundId = 2;
            globalConfigsRepository
                .findOne({ type: "kenosoccer_liveodds" }, "blueRed overUnder")
                .lean()
                .exec.mockReturnValueOnce({ blueRed: {}, overUnder: {} });
            definition.generateResult.mockReturnValueOnce([1, 2, 3, 4, 5]).mockReturnValueOnce([6, 7, 8, 9, 10]);
            when(sumArrayNumber).calledWith([1, 2, 3, 4, 5]).mockReturnValue(15).calledWith([6, 7, 8, 9, 10]).mockReturnValue(40);
            const roundResultConsumer = new RoundResultConsumer(
                gameData,
                definition,
                globalConfigsRepository,
                roundsRepository,
                roundResultPublisher
            );
            randomString.mockReturnValue("salt");
            const resultKey = `{15;40}_{#2salt}`;

            // act
            await roundResultConsumer.generateFirstHalfResult();

            // assert
            expect(createHashMD5).toHaveBeenCalledWith(resultKey);
        });

        it("should create round with encrypt result and md5", async () => {
            // arrange
            gameData.roundId = 2;
            gameData.exchangeRates = { exId: 1 };
            const liveOdds = {
                liveFTBlue: 1.97,
                liveFTRed: 1.97,
                liveFTOver: 11,
                liveFTUnder: 1.04,
            };
            gameData.gameConfigs.odds = { fhBlue: 10, fhEven: 10, fhOdd: 10, fhOver: 10, fhRed: 10, fhUnder: 10 };
            definition.generateResult.mockReturnValueOnce([1, 2, 3, 4, 5]).mockReturnValueOnce([6, 7, 8, 9, 10]);
            when(sumArrayNumber).calledWith([1, 2, 3, 4, 5]).mockReturnValue(15).calledWith([6, 7, 8, 9, 10]).mockReturnValue(40);
            globalConfigsRepository
                .findOne({ type: "kenosoccer_liveodds" }, "blueRed overUnder")
                .lean()
                .exec.mockReturnValueOnce({
                    blueRed: { [-25]: { liveFTBlue: liveOdds.liveFTBlue, liveFTRed: liveOdds.liveFTRed } },
                    overUnder: { 55: { liveFTOver: liveOdds.liveFTOver, liveFTUnder: liveOdds.liveFTUnder } },
                });
            const roundsRepositoryNew = stubMongooseModelStupidly(mongoose.Model);
            const roundResultConsumer = new RoundResultConsumer(
                gameData,
                definition,
                globalConfigsRepository,
                roundsRepositoryNew,
                roundResultPublisher
            );
            randomString.mockReturnValue("salt");
            const resultKey = `{15;40}_{#2salt}`;
            when(createHashMD5).calledWith(resultKey).mockReturnValue("md5String");
            when(encrypt)
                .calledWith(resultKey)
                .mockReturnValue("encryptedRawValueMd5String")
                .calledWith(JSON.stringify({ blue: [1, 2, 3, 4, 5], red: [6, 7, 8, 9, 10] }))
                .mockReturnValue("encryptedResult");

            // act
            await roundResultConsumer.generateFirstHalfResult();

            // assert
            expect(roundsRepositoryNew.create).toHaveBeenCalledWith({
                id: gameData.roundId,
                odds: { ...liveOdds, ...gameData.gameConfigs.odds },
                firstHalf: {
                    md5: "md5String",
                    resultKey: "encryptedRawValueMd5String",
                    encryptedResult: "encryptedResult",
                    time: new Date(123456),
                },
                time: new Date(123456),
                exchangeRateId: gameData.exchangeRates.exId,
            });
        });

        it("should store md5 in game data", async () => {
            // arrange
            gameData.roundId = 2;
            definition.generateResult.mockReturnValueOnce([1, 2, 3, 4, 5]).mockReturnValueOnce([6, 7, 8, 9, 10]);
            when(sumArrayNumber).calledWith([1, 2, 3, 4, 5]).mockReturnValue(15).calledWith([6, 7, 8, 9, 10]).mockReturnValue(40);
            globalConfigsRepository.findOne({ type: "kenosoccer_liveodds" }, "blueRed overUnder").lean().exec.mockReturnValueOnce({
                blueRed: {},
                overUnder: {},
            });
            const roundResultConsumer = new RoundResultConsumer(
                gameData,
                definition,
                globalConfigsRepository,
                roundsRepository,
                roundResultPublisher
            );
            randomString.mockReturnValue("salt");
            const resultKey = `{15;40}_{#2salt}`;
            when(createHashMD5).calledWith(resultKey).mockReturnValue("md5String");

            // act
            await roundResultConsumer.generateFirstHalfResult();

            // assert
            expect(gameData.currentMD5).toStrictEqual("md5String");
        });

        it("should store first half data in game data", async () => {
            // arrange
            gameData.roundId = 2;
            definition.generateResult.mockReturnValueOnce([1, 2, 3, 4, 5]).mockReturnValueOnce([6, 7, 8, 9, 10]);
            when(sumArrayNumber).calledWith([1, 2, 3, 4, 5]).mockReturnValue(15).calledWith([6, 7, 8, 9, 10]).mockReturnValue(40);
            globalConfigsRepository.findOne({ type: "kenosoccer_liveodds" }, "blueRed overUnder").lean().exec.mockReturnValueOnce({
                blueRed: {},
                overUnder: {},
            });
            definition.settle = jest.fn({ totalBlue: 15, totalRed: 40 }, true).mockReturnValue({ red: true, blue: false });
            const roundResultConsumer = new RoundResultConsumer(
                gameData,
                definition,
                globalConfigsRepository,
                roundsRepository,
                roundResultPublisher
            );
            randomString.mockReturnValue("salt");
            const resultKey = `{15;40}_{#2salt}`;
            when(createHashMD5).calledWith(resultKey).mockReturnValue("md5String");

            // act
            await roundResultConsumer.generateFirstHalfResult();

            // assert
            expect(gameData.firstHalfResult).toStrictEqual({
                result: { blue: [1, 2, 3, 4, 5], red: [6, 7, 8, 9, 10] },
                settlementResult: { red: true, blue: false },
                totalBlue: 15,
                totalRed: 40,
                resultKey,
                roundId: 2,
            });
        });

        it("should publish md5", async () => {
            // arrange
            gameData.roundId = 2;
            definition.generateResult.mockReturnValueOnce([1, 2, 3, 4, 5]).mockReturnValueOnce([6, 7, 8, 9, 10]);
            when(sumArrayNumber).calledWith([1, 2, 3, 4, 5]).mockReturnValue(15).calledWith([6, 7, 8, 9, 10]).mockReturnValue(40);
            globalConfigsRepository.findOne({ type: "kenosoccer_liveodds" }, "blueRed overUnder").lean().exec.mockReturnValueOnce({
                blueRed: {},
                overUnder: {},
            });
            const roundResultPublisherNew = stub(RoundResultPublisher);
            const roundResultConsumer = new RoundResultConsumer(
                gameData,
                definition,
                globalConfigsRepository,
                roundsRepository,
                roundResultPublisherNew
            );
            randomString.mockReturnValue("salt");
            const resultKey = `{15;40}_{#2salt}`;
            when(createHashMD5).calledWith(resultKey).mockReturnValue("md5String");

            // act
            await roundResultConsumer.generateFirstHalfResult();

            // assert
            expect(roundResultPublisherNew.publishMD5).toHaveBeenCalledWith("md5String");
        });
    });

    describe("handleFinishFistHalf", () => {
        it("should publish first half result", () => {
            // arrange
            const roundResultPublisherNew = stub(RoundResultPublisher);
            gameData.firstHalfResult = { settlementResult: { red: true, blue: false } };
            const roundResultConsumer = new RoundResultConsumer(
                gameData,
                definition,
                globalConfigsRepository,
                roundsRepository,
                roundResultPublisherNew
            );

            // act
            roundResultConsumer.handleFinishFistHalf();

            // assert
            expect(roundResultPublisherNew.publishFirstHalfResult).toHaveBeenCalledWith(gameData.firstHalfResult);
        });
        it("should publish live odds", () => {
            // arrange
            const roundResultPublisherNew = stub(RoundResultPublisher);
            gameData.liveOdds = {
                liveFTBlue: 1.97,
                liveFTRed: 1.97,
                liveFTOver: 11,
                liveFTUnder: 1.04,
            };
            const roundResultConsumer = new RoundResultConsumer(
                gameData,
                definition,
                globalConfigsRepository,
                roundsRepository,
                roundResultPublisherNew
            );

            // act
            roundResultConsumer.handleFinishFistHalf();

            // assert
            expect(roundResultPublisherNew.publishToAllUsers).toHaveBeenCalledWith({ liveOdds: gameData.liveOdds });
        });
    });

    describe("generateFullTimeResult", () => {
        it("should not call generateResult when set result from admin", async () => {
            gameData.roundId = 2;
            gameData.settlementResultFromAdmin = {
                roundId: 2,
                result: {
                    fullTime: {
                        result: { blue: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], red: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
                    },
                },
            };
            const roundResultConsumer = new RoundResultConsumer(
                gameData,
                definition,
                globalConfigsRepository,
                roundsRepository,
                roundResultPublisher
            );

            // act
            await roundResultConsumer.generateFullTimeResult();

            // assert
            expect(definition.generateResult).not.toHaveBeenCalled();
        });

        it("should call generateResult when not set result from admin", async () => {
            gameData.roundId = 2;
            gameData.gameConfigs.randomMode = 2;
            gameData.settlementResultFromAdmin = {};
            gameData.firstHalfResult = {
                result: { blue: [1, 2, 3, 4, 5], red: [6, 7, 8, 9, 10] },
            };
            const roundResultConsumer = new RoundResultConsumer(
                gameData,
                definition,
                globalConfigsRepository,
                roundsRepository,
                roundResultPublisher
            );

            // act
            await roundResultConsumer.generateFullTimeResult();

            // assert
            expect(definition.generateResult).toHaveBeenCalledTimes(2);
            expect(definition.generateResult).toHaveBeenNthCalledWith(1, 2, gameData.firstHalfResult.result.blue);
            expect(definition.generateResult).toHaveBeenNthCalledWith(2, 2, gameData.firstHalfResult.result.red);
        });

        it("should call create hash md5 with expected", async () => {
            gameData.roundId = 2;
            gameData.gameConfigs.randomMode = 2;
            gameData.firstHalfResult = {
                result: { blue: [1, 2, 3, 4, 5], red: [6, 7, 8, 9, 10] },
                totalBlue: 15,
                totalRed: 40,
            };
            when(definition.generateResult)
                .calledWith(2, gameData.firstHalfResult.result.blue)
                .mockReturnValue([11, 12, 13, 14, 15])
                .calledWith(2, gameData.firstHalfResult.result.red)
                .mockReturnValue([16, 17, 18, 19, 20]);
            when(sumArrayNumber).calledWith([11, 12, 13, 14, 15]).mockReturnValue(65).calledWith([16, 17, 18, 19, 20]).mockReturnValue(90);
            const roundResultConsumer = new RoundResultConsumer(
                gameData,
                definition,
                globalConfigsRepository,
                roundsRepository,
                roundResultPublisher
            );
            randomString.mockReturnValue("salt");
            const resultKey = `{80;130}_{#2salt}`;

            // act
            await roundResultConsumer.generateFullTimeResult();

            // assert
            expect(createHashMD5).toHaveBeenCalledWith(resultKey);
        });

        it("should store md5 in game data", async () => {
            gameData.roundId = 2;
            gameData.gameConfigs.randomMode = 2;
            gameData.firstHalfResult = {
                result: { blue: [1, 2, 3, 4, 5], red: [6, 7, 8, 9, 10] },
                totalBlue: 15,
                totalRed: 40,
            };
            when(definition.generateResult)
                .calledWith(2, gameData.firstHalfResult.result.blue)
                .mockReturnValue([11, 12, 13, 14, 15])
                .calledWith(2, gameData.firstHalfResult.result.red)
                .mockReturnValue([16, 17, 18, 19, 20]);
            when(sumArrayNumber).calledWith([11, 12, 13, 14, 15]).mockReturnValue(65).calledWith([16, 17, 18, 19, 20]).mockReturnValue(90);
            const roundResultConsumer = new RoundResultConsumer(
                gameData,
                definition,
                globalConfigsRepository,
                roundsRepository,
                roundResultPublisher
            );
            randomString.mockReturnValue("salt");
            const resultKey = `{80;130}_{#2salt}`;
            when(createHashMD5).calledWith(resultKey).mockReturnValue("md5String");

            // act
            await roundResultConsumer.generateFullTimeResult();

            // assert
            expect(gameData.currentMD5).toBe("md5String");
        });

        it("should update round - full time and result settlement result of first half", async () => {
            gameData.roundId = 2;
            gameData.gameConfigs.randomMode = 2;
            gameData.firstHalfResult = {
                result: { blue: [1, 2, 3, 4, 5], red: [6, 7, 8, 9, 10] },
                settlementResult: { red: true, blue: false },
                totalBlue: 15,
                totalRed: 40,
            };
            when(definition.generateResult)
                .calledWith(2, gameData.firstHalfResult.result.blue)
                .mockReturnValue([11, 12, 13, 14, 15])
                .calledWith(2, gameData.firstHalfResult.result.red)
                .mockReturnValue([16, 17, 18, 19, 20]);
            when(sumArrayNumber).calledWith([11, 12, 13, 14, 15]).mockReturnValue(65).calledWith([16, 17, 18, 19, 20]).mockReturnValue(90);
            randomString.mockReturnValue("salt");
            const resultKey = `{80;130}_{#2salt}`;
            when(createHashMD5).calledWith(resultKey).mockReturnValue("md5String");
            when(encrypt)
                .calledWith(resultKey)
                .mockReturnValue("encryptedResultString")
                .calledWith(JSON.stringify({ blue: [11, 12, 13, 14, 15], red: [16, 17, 18, 19, 20] }))
                .mockReturnValue("encryptedResultFullTime");
            const roundsRepositoryNew = stubMongooseModelStupidly(mongoose.Model);
            const roundResultConsumer = new RoundResultConsumer(
                gameData,
                definition,
                globalConfigsRepository,
                roundsRepositoryNew,
                roundResultPublisher
            );
            // act
            await roundResultConsumer.generateFullTimeResult();

            // assert
            expect(roundsRepositoryNew.updateOne).toHaveBeenCalledWith(
                { id: gameData.roundId },
                {
                    fullTime: {
                        md5: "md5String",
                        resultKey: "encryptedResultString",
                        encryptedResult: "encryptedResultFullTime",
                        time: new Date(123456),
                    },
                    "firstHalf.result": gameData.firstHalfResult.result,
                    "firstHalf.settlementResult": gameData.firstHalfResult.settlementResult,
                    "firstHalf.sum": gameData.firstHalfResult.totalBlue + gameData.firstHalfResult.totalRed,
                }
            );
        });

        it("should publish md5", async () => {
            gameData.roundId = 2;
            gameData.gameConfigs.randomMode = 2;
            gameData.firstHalfResult = {
                result: { blue: [1, 2, 3, 4, 5], red: [6, 7, 8, 9, 10] },
                totalBlue: 15,
                totalRed: 40,
            };
            when(definition.generateResult)
                .calledWith(2, gameData.firstHalfResult.result.blue)
                .mockReturnValue([11, 12, 13, 14, 15])
                .calledWith(2, gameData.firstHalfResult.result.red)
                .mockReturnValue([16, 17, 18, 19, 20]);
            when(sumArrayNumber).calledWith([11, 12, 13, 14, 15]).mockReturnValue(65).calledWith([16, 17, 18, 19, 20]).mockReturnValue(90);
            const roundResultPublisherNew = stub(RoundResultPublisher);
            const roundResultConsumer = new RoundResultConsumer(
                gameData,
                definition,
                globalConfigsRepository,
                roundsRepository,
                roundResultPublisherNew
            );
            randomString.mockReturnValue("salt");
            const resultKey = `{80;130}_{#2salt}`;
            when(createHashMD5).calledWith(resultKey).mockReturnValue("md5String");

            // act
            await roundResultConsumer.generateFullTimeResult();

            // assert
            expect(roundResultPublisherNew.publishMD5).toHaveBeenCalledWith("md5String");
        });
    });
});
