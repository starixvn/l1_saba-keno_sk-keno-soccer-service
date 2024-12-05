import { stub, stubMongooseModelStupidly } from "jest-micro-auto-stub";
import mongoose from "mongoose";
import { logger } from "sc-common";
import { Core } from "sc-game-base";

import { choices, choicesMapper } from "../../../src/constants";
import { RoundResultConsumer, SettleGameRoundConsumer } from "../../../src/consumers";
import { GameData } from "../../../src/game-data";
import { GameCron } from "../../../src/crons/game-cron";
import { decrypt } from "../../../src/helpers/crypto-helper";
import { sumArrayNumber } from "../../../src/helpers/array-helper";
import { when } from "jest-when";

jest.mock("../../../src/helpers/array-helper");
jest.mock("../../../src/helpers/crypto-helper");

describe("game cron instance", () => {
    const definition = {
        id: 1511,
        name: "SkKenoSoccer",
        configName: "skkenosoccer",
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

    const bot = stub(Core.Crons.BaseBot);

    /** @type {SettleGameRoundConsumer}*/
    const settleGameRoundConsumer = stub(SettleGameRoundConsumer);

    /** @type {Core.BaseEventPublishers.GameStatusPublisher}*/
    const gameStatusPublisher = stub(Core.BaseEventPublishers.GameStatusPublisher);

    /** @type {Core.BaseEventPublishers.RunningRoundInfoPublisher}*/
    const runningRoundInfoPublisher = stub(Core.BaseEventPublishers.RunningRoundInfoPublisher);

    /** @type {mongoose.Model}*/
    const gameConfigsRepository = stubMongooseModelStupidly(mongoose.Model);
    gameConfigsRepository.updateOne = jest.fn();

    /** @type {mongoose.Model}*/
    const roundsRepository = stubMongooseModelStupidly(mongoose.Model);

    /** @type {mongoose.Model}*/
    const archiveStatusesRepository = stubMongooseModelStupidly(mongoose.Model);

    /** @type {mongoose.Model}*/
    const exchangeRatesRepository = stubMongooseModelStupidly(mongoose.Model);

    /** @type {mongoose.Model}*/
    const currencyGroupGamesRepository = stubMongooseModelStupidly(mongoose.Model);

    /** @type {mongoose.Model}*/
    const notificationRepository = stubMongooseModelStupidly(mongoose.Model);

    /** @type {mongoose.Model}*/
    const globalConfigsRepository = stubMongooseModelStupidly(mongoose.Model);

    /** @type {mongoose.Model}*/
    const partnerConfigRepository = stubMongooseModelStupidly(mongoose.Model);

    /** @type {mongoose.Model}*/
    const currencyGroupRepository = stubMongooseModelStupidly(mongoose.Model);

    /** @type {mongoose.Model}*/
    const currencyRepository = stubMongooseModelStupidly(mongoose.Model);

    /** @type {RoundResultConsumer}*/
    const roundResultConsumer = stub(RoundResultConsumer);

    const gameCron = new GameCron({
        definition,
        gameData,
        bot,
        settleGameRoundConsumer,
        gameStatusPublisher,
        runningRoundInfoPublisher,
        logService,
        gameConfigsRepository,
        roundsRepository,
        archiveStatusesRepository,
        notificationRepository,
        exchangeRatesRepository,
        currencyGroupGamesRepository,
        partnerConfigRepository,
        currencyGroupRepository,
        currencyRepository,
        roundResultConsumer,
        globalConfigsRepository,
    });

    it("should be instance of Core.Crons.BaseGameCron", () => {
        expect(gameCron instanceof Core.Crons.BaseGameCron).toBeTruthy();
    });

    describe("checkGameStatus tests", () => {
        it("game is enabled, should update gameData.gameConfigs and call publishStartGame", async () => {
            const gameConfigs = { enabled: true };
            gameData.disabled = false;
            gameData.remainingTime = definition.durations.wholeRound;
            gameConfigsRepository.findOne().lean().exec.mockReturnValueOnce({ enabled: true });

            await gameCron.checkGameStatus();

            expect(gameData.gameConfigs).toEqual(gameConfigs);
            expect(gameStatusPublisher.publishStartGame).toHaveBeenCalled();
        });

        it("game is disabled, should reset gameData.remainingTime, update game configs and call publishDisableGameStatus", async () => {
            const gameConfigs = { enabled: false };
            gameData.disabled = false;
            gameData.remainingTime = definition.durations.wholeRound;
            gameConfigsRepository.findOne().lean().exec.mockReturnValueOnce(gameConfigs);

            await gameCron.checkGameStatus();

            expect(gameData.gameConfigs).toEqual(gameConfigs);
            expect(gameData.remainingTime).toEqual(definition.durations.wholeRound);
            expect(gameConfigsRepository.updateOne).toHaveBeenCalled();
            expect(gameStatusPublisher.publishDisableGameStatus).toHaveBeenCalled();
        });

        it("game is currently disabled, then being enabled, should call publishEnablingGameStatus", async () => {
            const gameConfigs = { enabled: true };
            gameData.disabled = true;
            gameData.remainingTime = definition.durations.wholeRound;
            gameConfigsRepository.findOne().lean().exec.mockReturnValueOnce(gameConfigs);

            await gameCron.checkGameStatus();

            expect(gameData.gameConfigs).toEqual(gameConfigs);
            expect(gameStatusPublisher.publishEnablingGameStatus).toHaveBeenCalled();
        });
    });

    describe("proceed tests", () => {
        it("should call checkGameStatus after each round", async () => {
            // arrange
            gameData.disabled = false;
            gameData.remainingTime = definition.durations.wholeRound;
            gameCron.checkGameStatus = jest.fn();

            // act
            await gameCron.proceed();

            // assert
            expect(gameCron.checkGameStatus).toHaveBeenCalled();
        });

        it("should call resetForNewRound and generate first half at starting round", async () => {
            // arrange
            gameData.disabled = false;
            gameData.remainingTime = definition.durations.firstHalfPlacingBets + 1;

            jest.spyOn(gameCron, "resetForNewRound");

            // act
            await gameCron.proceed();

            // assert
            expect(gameCron.resetForNewRound).toHaveBeenCalled();
            expect(roundResultConsumer.generateFirstHalfResult).toHaveBeenCalled();
        });

        it("should call handleFinishFistHalf at finish half time", async () => {
            // arrange
            gameData.disabled = false;
            gameData.remainingTime = definition.durations.finishFirstHalf + 1;

            // act
            await gameCron.proceed();

            // assert
            expect(roundResultConsumer.handleFinishFistHalf).toHaveBeenCalled();
        });

        it("should call generate fulltime result at placing bet time", async () => {
            // arrange
            gameData.disabled = false;
            gameData.remainingTime = definition.durations.placingBets + 1;

            // act
            await gameCron.proceed();

            // assert
            expect(roundResultConsumer.generateFullTimeResult).toHaveBeenCalled();
        });

        it("should call settleRound when remainingTime is less than 0", async () => {
            // arrange
            gameData.disabled = false;
            gameData.remainingTime = 0;

            // act
            await gameCron.proceed();

            // assert
            expect(gameData.remainingTime).toEqual(definition.durations.wholeRound);
            expect(settleGameRoundConsumer.settleRound).toHaveBeenCalled();
        });

        it("should call runningRoundInfoPublisher.publish when remaining time is in placing bet time", async () => {
            // arrange
            gameData.disabled = false;
            gameData.remainingTime = definition.durations.placingBets;

            gameCron.checkGameStatus = jest.fn();

            // act
            await gameCron.proceed();

            // assert
            expect(runningRoundInfoPublisher.publish).toHaveBeenCalled();
        });
    });

    describe("start tests", () => {
        it("should call getLastArchiveRound when last round doesn't exist", async () => {
            // arrange
            roundsRepository.findOne().lean().exec.mockReturnValueOnce(null);
            spyOn(gameCron, "getLastArchiveRound");

            // act
            await gameCron.start();

            // arrange
            expect(gameCron.getLastArchiveRound).toHaveBeenCalled();
        });

        it("should increase round id when last round was settled", async () => {
            // arrange
            roundsRepository.findOne().lean().exec.mockReturnValueOnce({ id: 1, settled: true });

            // act
            await gameCron.start();

            // arrange
            expect(gameData.roundId).toStrictEqual(2);
        });

        it("should keep round id when last round is running", async () => {
            // arrange
            roundsRepository.findOne().lean().exec.mockReturnValueOnce({ id: 1, settled: false });

            // act
            await gameCron.start();

            // arrange
            expect(gameData.roundId).toStrictEqual(1);
        });
    });

    describe("initGameData", () => {
        beforeEach(() => {
            gameData.roundId = 2;
        });
        it("should call find round", async () => {
            // arrange
            const roundsRepositoryNew = stubMongooseModelStupidly(mongoose.Model);
            const cron = new GameCron({
                definition,
                gameData,
                roundsRepository: roundsRepositoryNew,
            });

            // act
            await cron.initGameData();

            // assert
            expect(roundsRepositoryNew.findOne({ id: gameData.roundId }, "id firstHalf fullTime settled").lean().exec).toHaveBeenCalled();
        });

        describe("when not found round", () => {
            it("should not call handleFinishFistHalf", async () => {
                // arrange
                const roundsRepositoryNew = stubMongooseModelStupidly(mongoose.Model);
                roundsRepositoryNew
                    .findOne({ id: gameData.roundId }, "id firstHalf fullTime settled")
                    .lean()
                    .exec.mockReturnValueOnce(null);
                const roundResultConsumerNew = { handleFinishFistHalf: jest.fn() };
                const cron = new GameCron({
                    definition,
                    gameData,
                    roundsRepository: roundsRepositoryNew,
                    roundResultConsumer: roundResultConsumerNew,
                });

                // act
                await cron.initGameData();

                // assert
                expect(roundResultConsumerNew.handleFinishFistHalf).not.toHaveBeenCalled();
            });
        });

        describe("when exist round", () => {
            // arrange
            const round = {
                firstHalf: {
                    md5: "md5String",
                    resultKey: { iv: "asd", content: "encryptedResultKey" },
                    encryptedResult: { iv: "dsa", content: "encryptedResult" },
                },
            };
            const result = { blue: [1, 2, 3, 4, 5], red: [6, 7, 8, 9, 10] };

            when(decrypt)
                .calledWith(round.firstHalf.encryptedResult)
                .mockReturnValue(JSON.stringify(result))
                .calledWith(round.firstHalf.resultKey)
                .mockReturnValue("resultKey");
            when(sumArrayNumber).calledWith(result.blue).mockReturnValue(15).calledWith(result.red).mockReturnValue(40);

            beforeEach(() => {
                definition.settle = jest.fn();
                globalConfigsRepository
                    .findOne({ type: "kenosoccer_liveodds" }, "blueRed overUnder")
                    .lean()
                    .exec.mockReturnValueOnce({
                        blueRed: { [-25]: { liveFTBlue: 1.97, liveFTRed: 1.97 } },
                        overUnder: { 55: { liveFTOver: 11, liveFTUnder: 1.04 } },
                    });
            });

            it("should call get settlement result with expected param", async () => {
                // arrange
                roundsRepository.findOne({ id: gameData.roundId }, "id firstHalf fullTime settled").lean().exec.mockReturnValueOnce(round);
                const cron = new GameCron({
                    definition,
                    gameData,
                    roundsRepository,
                    roundResultConsumer,
                    globalConfigsRepository,
                });

                // act
                await cron.initGameData();

                // assert
                expect(definition.settle).toHaveBeenCalledWith({ totalBlue: 15, totalRed: 40 }, true);
            });

            it("should store first half result in game data", async () => {
                // arrange
                roundsRepository.findOne({ id: gameData.roundId }, "id firstHalf fullTime settled").lean().exec.mockReturnValueOnce(round);
                definition.settle = jest.fn({ totalBlue: 15, totalRed: 40 }, true).mockReturnValue({ red: true, blue: false });
                const cron = new GameCron({
                    definition,
                    gameData,
                    roundsRepository,
                    roundResultConsumer,
                    globalConfigsRepository,
                });

                // act
                await cron.initGameData();

                // assert
                expect(gameData.firstHalfResult).toStrictEqual({
                    result,
                    resultKey: "resultKey",
                    settlementResult: { red: true, blue: false },
                    totalBlue: 15,
                    totalRed: 40,
                    roundId: gameData.roundId,
                });
            });

            it("should store md5 in game data", async () => {
                // arrange
                roundsRepository.findOne({ id: gameData.roundId }, "id firstHalf fullTime settled").lean().exec.mockReturnValueOnce(round);
                const cron = new GameCron({
                    definition,
                    gameData,
                    roundsRepository,
                    roundResultConsumer,
                    globalConfigsRepository,
                });

                // act
                await cron.initGameData();

                // assert
                expect(gameData.currentMD5).toBe(round.firstHalf.md5);
            });

            it("should store live odds in game data", async () => {
                // arrange
                roundsRepository.findOne({ id: gameData.roundId }, "id firstHalf fullTime settled").lean().exec.mockReturnValueOnce(round);
                const cron = new GameCron({
                    definition,
                    gameData,
                    roundsRepository,
                    roundResultConsumer,
                    globalConfigsRepository,
                });

                // act
                await cron.initGameData();

                // assert
                expect(gameData.liveOdds).toStrictEqual({ liveFTBlue: 1.97, liveFTRed: 1.97, liveFTOver: 11, liveFTUnder: 1.04 });
            });

            it("should call handleFinishFirstHalf", async () => {
                // arrange
                roundsRepository.findOne({ id: gameData.roundId }, "id firstHalf fullTime settled").lean().exec.mockReturnValueOnce(round);
                const roundResultConsumerNew = { handleFinishFistHalf: jest.fn() };
                const cron = new GameCron({
                    definition,
                    gameData,
                    roundsRepository,
                    roundResultConsumer: roundResultConsumerNew,
                    globalConfigsRepository,
                });

                // act
                await cron.initGameData();

                // assert
                expect(roundResultConsumerNew.handleFinishFistHalf).toHaveBeenCalled();
            });

            describe("when have result fulltime", () => {
                it("should set remaining time equal 0", async () => {
                    // arrange
                    const currentRound = { ...round, fullTime: { encryptedResult: { iv: "123", content: "result" } } };
                    roundsRepository
                        .findOne({ id: gameData.roundId }, "id firstHalf fullTime settled")
                        .lean()
                        .exec.mockReturnValueOnce(currentRound);
                    const cron = new GameCron({
                        definition,
                        gameData,
                        roundsRepository,
                        roundResultConsumer,
                        globalConfigsRepository,
                    });

                    // act
                    await cron.initGameData();

                    // assert
                    expect(gameData.remainingTime).toBe(0);
                });
            });

            describe("when not result fulltime", () => {
                it("should set remaining time equal durations finishFirstHalf", async () => {
                    // arrange
                    roundsRepository
                        .findOne({ id: gameData.roundId }, "id firstHalf fullTime settled")
                        .lean()
                        .exec.mockReturnValueOnce(round);
                    const cron = new GameCron({
                        definition,
                        gameData,
                        roundsRepository,
                        roundResultConsumer,
                        globalConfigsRepository,
                    });

                    // act
                    await cron.initGameData();

                    // assert
                    expect(gameData.remainingTime).toBe(definition.durations.finishFirstHalf);
                });
            });
        });
    });
});
