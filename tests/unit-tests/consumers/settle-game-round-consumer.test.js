import { stub, stubMongooseModelStupidly } from "jest-micro-auto-stub";
import mongoose from "mongoose";
import { logger } from "sc-common";
import { Core } from "sc-game-base";

import { choices, choicesMapper } from "../../../src/constants";
import { GameData } from "../../../src/game-data";
import { RoundResultPublisher } from "../../../src/publishers";
import { SettleGameRoundConsumer } from "../../../src/consumers/settle-game-round-consumer";
import { decrypt } from "../../../src/helpers/crypto-helper";
import { when } from "jest-when";
import { sumArrayNumber, sumArrayObject } from "../../../src/helpers/array-helper";

jest.mock("../../../src/helpers/crypto-helper");
jest.mock(".../../../src/helpers/array-helper");

describe("settle game round consumer instance", () => {
    // arrange
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
    const roundsRepository = stubMongooseModelStupidly(mongoose.Model);

    /** @type {RoundResultPublisher}*/
    const roundResultPublisher = stub(RoundResultPublisher);

    /** @type {Core.BaseEventPublishers.UserBetResultPublisher}*/
    const userBetResultPublisher = stub(Core.BaseEventPublishers.UserBetResultPublisher);

    const endGame = jest.fn();

    /** @type {logger}*/
    const logService = stub(logger);

    /** @type {mongoose.Model}*/
    const betsRepository = stubMongooseModelStupidly(mongoose.Model);
    const consumer = new SettleGameRoundConsumer({
        definition: definition,
        gameData: gameData,
        roundResultPublisher: roundResultPublisher,
        userBetResultPublisher: userBetResultPublisher,
        endGame: endGame,
        roundsRepository: roundsRepository,
        betsRepository: betsRepository,
        logService: logService,
    });

    it("should instance of Core.BaseEventConsumers.SettleGameRoundConsumer", () => {
        expect(consumer instanceof Core.BaseEventConsumers.SettleGameRoundConsumer).toBeTruthy();
    });

    describe("settleRound tests", () => {
        it("should call find round", async () => {
            // arrange
            const roundsRepositoryNew = stubMongooseModelStupidly(mongoose.Model);
            gameData.roundId = 2;
            const settleConsumer = new SettleGameRoundConsumer({
                definition: definition,
                gameData: gameData,
                roundsRepository: roundsRepositoryNew,
            });

            // act
            await settleConsumer.settleRound();

            // assert
            expect(roundsRepositoryNew.findOne({ id: gameData.roundId }).lean().exec).toHaveBeenCalled();
        });
        describe("when not exists round", () => {
            it("should not call settleBets", async () => {
                // arrange
                gameData.roundId = 2;
                roundsRepository.findOne({ id: gameData.roundId }).lean().exec.mockReturnValueOnce(null);
                const settleConsumer = new SettleGameRoundConsumer({
                    definition: definition,
                    gameData: gameData,
                    roundsRepository,
                });
                settleConsumer.settleBets = jest.fn();

                // act
                await settleConsumer.settleRound();

                // assert
                expect(settleConsumer.settleBets).not.toHaveBeenCalled();
            });
        });

        describe("when exist round", () => {
            // arrange
            const round = { id: 2, fullTime: { encryptedResult: { iv: "asd", content: "encryptedResult" } } };
            const fullTimeResult = { blue: [11, 12, 13, 14, 15], red: [16, 17, 18, 19, 20] };
            beforeEach(() => {
                definition.settle = jest.fn();
                gameData.roundId = 2;
                gameData.firstHalfResult = {
                    result: { blue: [1, 2, 3, 4, 5], red: [6, 7, 8, 9, 10] },
                    settlementResult: { red: true, blue: false },
                    totalBlue: 15,
                    totalRed: 40,
                };
                roundsRepository.findOne({ id: 2 }).lean().exec.mockReturnValueOnce(round);
                when(decrypt).calledWith(round.fullTime.encryptedResult).mockReturnValueOnce(JSON.stringify(fullTimeResult));
            });
            it("should update round id in game data", async () => {
                // arrange
                const settleConsumer = new SettleGameRoundConsumer({ definition, gameData, roundsRepository });
                settleConsumer.settleBets = jest.fn();

                // act
                await settleConsumer.settleRound();

                // assert
                expect(gameData.roundId).toBe(3);
            });

            it("should decrypt result with expected", async () => {
                // arrange
                const settleConsumer = new SettleGameRoundConsumer({ definition, gameData, roundsRepository });
                settleConsumer.settleBets = jest.fn();

                // act
                await settleConsumer.settleRound();

                // assert
                expect(decrypt).toHaveBeenCalledWith(round.fullTime.encryptedResult);
            });

            it("should call get settlement result with expected", async () => {
                // arrange
                const settleConsumer = new SettleGameRoundConsumer({ definition, gameData, roundsRepository });
                settleConsumer.settleBets = jest.fn();
                when(sumArrayNumber).calledWith(fullTimeResult.blue).mockReturnValue(65).calledWith(fullTimeResult.red).mockReturnValue(90);

                // act
                await settleConsumer.settleRound();

                // assert
                expect(definition.settle).toHaveBeenCalledWith({ totalBlue: 80, totalRed: 130 }, false);
            });

            it("should call settleBets with expect param", async () => {
                // arrange
                definition.settle = jest.fn({ totalBlue: 80, totalRed: 130 }, false).mockReturnValue({ red: true, blue: false });
                const settleConsumer = new SettleGameRoundConsumer({ definition, gameData, roundsRepository });
                settleConsumer.settleBets = jest.fn();
                when(sumArrayNumber).calledWith(fullTimeResult.blue).mockReturnValue(65).calledWith(fullTimeResult.red).mockReturnValue(90);

                // act
                await settleConsumer.settleRound();

                // assert
                expect(settleConsumer.settleBets).toHaveBeenCalledWith({
                    ...round,
                    fullTime: {
                        result: fullTimeResult,
                        settlementResult: { red: true, blue: false },
                        sum: 210,
                        ...round.fullTime,
                    },
                });
            });

            it("should call update round with expected", async () => {
                // arrange
                definition.settle = jest.fn({ totalBlue: 80, totalRed: 130 }, false).mockReturnValue({ red: true, blue: false });
                const settleConsumer = new SettleGameRoundConsumer({ definition, gameData, roundsRepository });
                settleConsumer.settleBets = jest.fn();
                when(sumArrayNumber).calledWith(fullTimeResult.blue).mockReturnValue(65).calledWith(fullTimeResult.red).mockReturnValue(90);

                // act
                await settleConsumer.settleRound();

                // assert
                expect(roundsRepository.updateOne).toHaveBeenCalledWith(
                    { id: round.id },
                    {
                        settled: true,
                        fullTime: {
                            result: fullTimeResult,
                            settlementResult: { red: true, blue: false },
                            sum: 210,
                            ...round.fullTime,
                        },
                    }
                );
            });
        });
    });

    describe("settleBets test", () => {
        const round = {
            id: 2,
            fullTime: {
                result: { blue: [11, 12, 13, 14, 15], red: [16, 17, 18, 19, 20] },
                settlementResult: { red: true, blue: false },
                resultKey: { iv: "asd", content: "encryptedResultKey" },
                time: new Date(123456),
            },
            firstHalf: {
                result: { blue: [1, 2, 3, 4, 5], red: [6, 7, 8, 9, 10] },
                settlementResult: { red: true, blue: false },
            },
            odds: { fhBlue: 10, fhEven: 10, fhOdd: 10, fhOver: 10, fhRed: 10 },
        };
        describe("when not found bets", () => {
            it("should call query bet", async () => {
                // arrange
                const settleConsumer = new SettleGameRoundConsumer({ definition, gameData, roundResultPublisher });
                settleConsumer.queryBets = jest.fn();

                // act
                await settleConsumer.settleBets(round);

                // assert
                expect(settleConsumer.queryBets).toHaveBeenCalledWith(round.id);
            });

            it("should not call end game", async () => {
                // arrange
                const settleConsumer = new SettleGameRoundConsumer({ definition, gameData, roundResultPublisher });
                settleConsumer.queryBets = jest.fn(round.id).mockReturnValue(null);
                settleConsumer.callEndGame = jest.fn();

                // act
                await settleConsumer.settleBets(round);

                // assert
                expect(settleConsumer.callEndGame).not.toHaveBeenCalled();
            });

            it("should publish round result", async () => {
                // arrange
                const settleConsumer = new SettleGameRoundConsumer({ definition, gameData, roundResultPublisher });
                settleConsumer.queryBets = jest.fn(round.id).mockReturnValue(null);
                when(decrypt).calledWith(round.fullTime.resultKey).mockReturnValue("resultKey");

                // act
                await settleConsumer.settleBets(round);

                // assert
                expect(roundResultPublisher.publishRoundResult).toHaveBeenCalledWith({
                    result: round.fullTime.result,
                    settlementResult: round.fullTime.settlementResult,
                    resultKey: "resultKey",
                    roundId: round.id,
                });
            });
        });

        describe("when exist bets", () => {
            // arrange
            const baseBets = [
                { uid: 1, rate: { VND: 1000 }, paid: false, save: jest.fn(), red: 10 },
                { uid: 2, rate: { VND: 1000 }, paid: false, save: jest.fn(), blue: 10 },
            ];

            beforeEach(() => {
                when(sumArrayObject)
                    .calledWith([
                        { totalBetAmount: 0, totalWin: 0, netWin: 0, totalLost: 0, refund: 0, winningByChoices: {} },
                        {
                            totalBetAmount: 10,
                            totalWin: 20,
                            netWin: 10,
                            totalLost: 0,
                            refund: 0,
                            winningByChoices: { 1: { red: 10 } },
                        },
                    ])
                    .mockReturnValueOnce({
                        totalBetAmount: 10,
                        totalWin: 20,
                        netWin: 10,
                        totalLost: 0,
                        refund: 0,
                    })
                    .calledWith([
                        { totalBetAmount: 0, totalWin: 0, netWin: 0, totalLost: 0, refund: 0, winningByChoices: {} },
                        {
                            totalBetAmount: 10,
                            totalWin: 10,
                            netWin: 0,
                            totalLost: 10,
                            refund: 10,
                            winningByChoices: {},
                        },
                    ])
                    .mockReturnValueOnce({
                        totalBetAmount: 10,
                        totalWin: 10,
                        netWin: 0,
                        totalLost: 10,
                        refund: 10,
                    });
            });

            it("should calculateBetResult with firstHalf", async () => {
                // arrange
                const settleConsumer = new SettleGameRoundConsumer({ definition, gameData, roundResultPublisher, userBetResultPublisher });
                settleConsumer.queryBets = jest.fn(round.id).mockReturnValue(baseBets);
                settleConsumer.calculateBetResult = jest.fn().mockReturnValue({});
                settleConsumer.callEndGame = jest.fn();
                settleConsumer.captureBetResult = jest.fn();
                sumArrayObject.mockReturnValue({});

                // act
                await settleConsumer.settleBets(round);

                // assert
                expect(settleConsumer.calculateBetResult).toHaveBeenCalledWith(
                    round.firstHalf.settlementResult,
                    baseBets[0],
                    round.odds,
                    true
                );
                expect(settleConsumer.calculateBetResult).toHaveBeenCalledWith(
                    round.firstHalf.settlementResult,
                    baseBets[1],
                    round.odds,
                    true
                );
            });

            it("should calculateBetResult with fullTime", async () => {
                // arrange
                const settleConsumer = new SettleGameRoundConsumer({ definition, gameData, roundResultPublisher, userBetResultPublisher });
                settleConsumer.queryBets = jest.fn(round.id).mockReturnValue(baseBets);
                settleConsumer.calculateBetResult = jest.fn().mockReturnValue({});
                settleConsumer.callEndGame = jest.fn();
                settleConsumer.captureBetResult = jest.fn();
                sumArrayObject.mockReturnValue({});

                // act
                await settleConsumer.settleBets(round);

                // assert
                expect(settleConsumer.calculateBetResult).toHaveBeenCalledWith(
                    round.fullTime.settlementResult,
                    baseBets[0],
                    round.odds,
                    false
                );
                expect(settleConsumer.calculateBetResult).toHaveBeenCalledWith(
                    round.fullTime.settlementResult,
                    baseBets[1],
                    round.odds,
                    false
                );
            });

            it("should call sumArrayObject with expected", async () => {
                // arrange
                const settleConsumer = new SettleGameRoundConsumer({ definition, gameData, roundResultPublisher, userBetResultPublisher });
                settleConsumer.queryBets = jest.fn(round.id).mockReturnValue(baseBets);
                settleConsumer.calculateBetResult = jest.fn();
                when(settleConsumer.calculateBetResult)
                    .calledWith(round.firstHalf.settlementResult, baseBets[0], round.odds, true)
                    .mockReturnValue({ totalBetAmount: 0, totalWin: 0, netWin: 0, totalLost: 0, refund: 0 })
                    .calledWith(round.firstHalf.settlementResult, baseBets[1], round.odds, true)
                    .mockReturnValue({ totalBetAmount: 0, totalWin: 0, netWin: 0, totalLost: 0, refund: 0 })
                    .calledWith(round.fullTime.settlementResult, baseBets[0], round.odds, false)
                    .mockReturnValue({ totalBetAmount: 10, totalWin: 20, netWin: 10, totalLost: 0, refund: 0 })
                    .calledWith(round.fullTime.settlementResult, baseBets[1], round.odds, false)
                    .mockReturnValue({ totalBetAmount: 10, totalWin: 0, netWin: 0, totalLost: 10, refund: 0 });
                settleConsumer.callEndGame = jest.fn();
                settleConsumer.captureBetResult = jest.fn();
                sumArrayObject.mockReturnValue({});

                // act
                await settleConsumer.settleBets(round);

                // assert
                expect(sumArrayObject).toHaveBeenCalledWith([
                    { totalBetAmount: 0, totalWin: 0, netWin: 0, totalLost: 0, refund: 0 },
                    { totalBetAmount: 10, totalWin: 20, netWin: 10, totalLost: 0, refund: 0 },
                ]);
                expect(sumArrayObject).toHaveBeenCalledWith([
                    { totalBetAmount: 0, totalWin: 0, netWin: 0, totalLost: 0, refund: 0 },
                    { totalBetAmount: 10, totalWin: 0, netWin: 0, totalLost: 10, refund: 0 },
                ]);
            });

            describe("when update bets", () => {
                // arrange
                const settleConsumer = new SettleGameRoundConsumer({ definition, gameData, roundResultPublisher, userBetResultPublisher });
                settleConsumer.calculateBetResult = jest.fn();
                settleConsumer.callEndGame = jest.fn();
                settleConsumer.captureBetResult = jest.fn();

                let bets = [];

                beforeEach(() => {
                    bets = [
                        { uid: 1, rate: { VND: 1000 }, paid: false, save: jest.fn(), red: 10 },
                        { uid: 2, rate: { VND: 1000 }, paid: false, save: jest.fn(), blue: 10 },
                    ];
                    settleConsumer.queryBets = jest.fn(round.id).mockReturnValue(bets);
                    when(settleConsumer.calculateBetResult)
                        .calledWith(round.firstHalf.settlementResult, bets[0], round.odds, true)
                        .mockReturnValueOnce({ totalBetAmount: 0, totalWin: 0, netWin: 0, totalLost: 0, refund: 0, winningByChoices: {} })
                        .calledWith(round.firstHalf.settlementResult, bets[1], round.odds, true)
                        .mockReturnValueOnce({ totalBetAmount: 0, totalWin: 0, netWin: 0, totalLost: 0, refund: 0, winningByChoices: {} })
                        .calledWith(round.fullTime.settlementResult, bets[0], round.odds, false)
                        .mockReturnValueOnce({
                            totalBetAmount: 10,
                            totalWin: 20,
                            netWin: 10,
                            totalLost: 0,
                            refund: 0,
                            winningByChoices: {},
                        })
                        .calledWith(round.fullTime.settlementResult, bets[1], round.odds, false)
                        .mockReturnValueOnce({
                            totalBetAmount: 10,
                            totalWin: 10,
                            netWin: 0,
                            totalLost: 10,
                            refund: 10,
                            winningByChoices: {},
                        });
                    when(sumArrayObject)
                        .calledWith([
                            { totalBetAmount: 0, totalWin: 0, netWin: 0, totalLost: 0, refund: 0, winningByChoices: {} },
                            {
                                totalBetAmount: 10,
                                totalWin: 20,
                                netWin: 10,
                                totalLost: 0,
                                refund: 0,
                                winningByChoices: {},
                            },
                        ])
                        .mockReturnValueOnce({
                            totalBetAmount: 10,
                            totalWin: 20,
                            netWin: 10,
                            totalLost: 0,
                            refund: 0,
                            winningByChoices: {},
                        })
                        .calledWith([
                            { totalBetAmount: 0, totalWin: 0, netWin: 0, totalLost: 0, refund: 0, winningByChoices: {} },
                            {
                                totalBetAmount: 10,
                                totalWin: 10,
                                netWin: 0,
                                totalLost: 10,
                                refund: 10,
                                winningByChoices: {},
                            },
                        ])
                        .mockReturnValueOnce({
                            totalBetAmount: 10,
                            totalWin: 10,
                            netWin: 0,
                            totalLost: 10,
                            refund: 10,
                            winningByChoices: {},
                        });
                });

                it("should update betWin", async () => {
                    // act
                    await settleConsumer.settleBets(round);

                    // assert
                    expect(bets[0].betwin).toBe(20);
                    expect(bets[1].betwin).toBe(0);
                });

                it("should update refund", async () => {
                    // act
                    await settleConsumer.settleBets(round);

                    // assert
                    expect(bets[0].refund).toBe(0);
                    expect(bets[1].refund).toBe(10);
                });

                it("should update paid", async () => {
                    // act
                    await settleConsumer.settleBets(round);

                    // assert
                    expect(bets[0].paid).toBeTrue();
                    expect(bets[1].paid).toBeTrue();
                });

                it("should update odds", async () => {
                    // act
                    await settleConsumer.settleBets(round);

                    // assert
                    expect(bets[0].odds).toStrictEqual(round.odds);
                    expect(bets[1].odds).toStrictEqual(round.odds);
                });

                it("should call save", async () => {
                    // act
                    await settleConsumer.settleBets(round);

                    // assert
                    expect(bets[0].save).toHaveBeenCalled();
                    expect(bets[1].save).toHaveBeenCalled();
                });
            });

            it("should call endGame with expected", async () => {
                // arrange
                const settleConsumer = new SettleGameRoundConsumer({ definition, gameData, roundResultPublisher, userBetResultPublisher });
                settleConsumer.queryBets = jest.fn(round.id).mockReturnValue(baseBets);
                settleConsumer.calculateBetResult = jest.fn();
                when(settleConsumer.calculateBetResult)
                    .calledWith(round.firstHalf.settlementResult, baseBets[0], round.odds, true)
                    .mockReturnValueOnce({ totalBetAmount: 0, totalWin: 0, netWin: 0, totalLost: 0, refund: 0, winningByChoices: {} })
                    .calledWith(round.firstHalf.settlementResult, baseBets[1], round.odds, true)
                    .mockReturnValueOnce({ totalBetAmount: 0, totalWin: 0, netWin: 0, totalLost: 0, refund: 0, winningByChoices: {} })
                    .calledWith(round.fullTime.settlementResult, baseBets[0], round.odds, false)
                    .mockReturnValueOnce({
                        totalBetAmount: 10,
                        totalWin: 20,
                        netWin: 10,
                        totalLost: 0,
                        refund: 0,
                        winningByChoices: { 1: { red: 10 } },
                    })
                    .calledWith(round.fullTime.settlementResult, baseBets[1], round.odds, false)
                    .mockReturnValueOnce({
                        totalBetAmount: 10,
                        totalWin: 10,
                        netWin: 0,
                        totalLost: 10,
                        refund: 10,
                        winningByChoices: {},
                    });
                settleConsumer.callEndGame = jest.fn();
                settleConsumer.captureBetResult = jest.fn();

                // act
                await settleConsumer.settleBets(round);

                // assert
                expect(settleConsumer.callEndGame).toHaveBeenCalledTimes(2);
                expect(settleConsumer.callEndGame).toHaveBeenCalledWith(baseBets[0], round.id, round.fullTime.time, {
                    totalBetAmount: 10,
                    totalWin: 20,
                    netWin: 10,
                    totalLost: 0,
                    refund: 0,
                    winningByChoices: { 1: { red: 10 } },
                });
                expect(settleConsumer.callEndGame).toHaveBeenCalledWith(baseBets[1], round.id, round.fullTime.time, {
                    totalBetAmount: 10,
                    totalWin: 10,
                    netWin: 0,
                    totalLost: 10,
                    refund: 10,
                    winningByChoices: {},
                });
            });

            it("should call captureBetResult with expected", async () => {
                // arrange
                const settleConsumer = new SettleGameRoundConsumer({ definition, gameData, roundResultPublisher, userBetResultPublisher });
                settleConsumer.queryBets = jest.fn(round.id).mockReturnValue(baseBets);
                settleConsumer.calculateBetResult = jest.fn();
                when(settleConsumer.calculateBetResult)
                    .calledWith(round.firstHalf.settlementResult, baseBets[0], round.odds, true)
                    .mockReturnValueOnce({ totalBetAmount: 0, totalWin: 0, netWin: 0, totalLost: 0, refund: 0, winningByChoices: {} })
                    .calledWith(round.firstHalf.settlementResult, baseBets[1], round.odds, true)
                    .mockReturnValueOnce({ totalBetAmount: 0, totalWin: 0, netWin: 0, totalLost: 0, refund: 0, winningByChoices: {} })
                    .calledWith(round.fullTime.settlementResult, baseBets[0], round.odds, false)
                    .mockReturnValueOnce({
                        totalBetAmount: 10,
                        totalWin: 20,
                        netWin: 10,
                        totalLost: 0,
                        refund: 0,
                        winningByChoices: { 1: { red: 10 } },
                    })
                    .calledWith(round.fullTime.settlementResult, baseBets[1], round.odds, false)
                    .mockReturnValueOnce({
                        totalBetAmount: 10,
                        totalWin: 10,
                        netWin: 0,
                        totalLost: 10,
                        refund: 10,
                        winningByChoices: {},
                    });
                settleConsumer.callEndGame = jest.fn();
                settleConsumer.captureBetResult = jest.fn();

                // act
                await settleConsumer.settleBets(round);

                // assert
                expect(settleConsumer.captureBetResult).toHaveBeenCalledTimes(2);
                expect(settleConsumer.captureBetResult).toHaveBeenCalledWith(
                    baseBets[0].uid,
                    {
                        totalBetAmount: 10,
                        totalWin: 20,
                        netWin: 10,
                        totalLost: 0,
                        refund: 0,
                        winningByChoices: { 1: { red: 10 } },
                    },
                    baseBets[0].rate
                );
                expect(settleConsumer.captureBetResult).toHaveBeenCalledWith(
                    baseBets[1].uid,
                    {
                        totalBetAmount: 10,
                        totalWin: 10,
                        netWin: 0,
                        totalLost: 10,
                        refund: 10,
                        winningByChoices: {},
                    },
                    baseBets[0].rate
                );
            });

            it("should call publish user bet with expected", async () => {
                // arrange
                const settleConsumer = new SettleGameRoundConsumer({ definition, gameData, roundResultPublisher, userBetResultPublisher });
                settleConsumer.queryBets = jest.fn(round.id).mockReturnValue(baseBets);
                settleConsumer.calculateBetResult = jest.fn();
                when(settleConsumer.calculateBetResult)
                    .calledWith(round.firstHalf.settlementResult, baseBets[0], round.odds, true)
                    .mockReturnValueOnce({ totalBetAmount: 0, totalWin: 0, netWin: 0, totalLost: 0, refund: 0, winningByChoices: {} })
                    .calledWith(round.firstHalf.settlementResult, baseBets[1], round.odds, true)
                    .mockReturnValueOnce({ totalBetAmount: 0, totalWin: 0, netWin: 0, totalLost: 0, refund: 0, winningByChoices: {} })
                    .calledWith(round.fullTime.settlementResult, baseBets[0], round.odds, false)
                    .mockReturnValueOnce({
                        totalBetAmount: 10,
                        totalWin: 20,
                        netWin: 10,
                        totalLost: 0,
                        refund: 0,
                        winningByChoices: { 1: { red: 10 } },
                    })
                    .calledWith(round.fullTime.settlementResult, baseBets[1], round.odds, false)
                    .mockReturnValueOnce({
                        totalBetAmount: 10,
                        totalWin: 10,
                        netWin: 0,
                        totalLost: 10,
                        refund: 10,
                        winningByChoices: {},
                    });
                settleConsumer.callEndGame = jest.fn();
                settleConsumer.captureBetResult = jest.fn();

                // act
                await settleConsumer.settleBets(round);

                // assert
                expect(userBetResultPublisher.publish).toHaveBeenCalledWith(baseBets[0].uid, {
                    totalBetAmount: 10,
                    totalWin: 20,
                    netWin: 10,
                    totalLost: 0,
                    refund: 0,
                    winningByChoices: { 1: { red: 10 } },
                });
                expect(userBetResultPublisher.publish).toHaveBeenCalledWith(baseBets[1].uid, {
                    totalBetAmount: 10,
                    totalWin: 10,
                    netWin: 0,
                    totalLost: 10,
                    refund: 10,
                    winningByChoices: {},
                });
            });

            it("should publish round result", async () => {
                // arrange
                const roundResultPublisherNew = stub(RoundResultPublisher);
                const settleConsumer = new SettleGameRoundConsumer({
                    definition,
                    gameData,
                    roundResultPublisher: roundResultPublisherNew,
                    userBetResultPublisher,
                });
                settleConsumer.queryBets = jest.fn(round.id).mockReturnValue(baseBets);
                settleConsumer.calculateBetResult = jest.fn().mockReturnValue({});
                settleConsumer.callEndGame = jest.fn();
                settleConsumer.captureBetResult = jest.fn();
                sumArrayObject.mockReturnValue({});
                when(decrypt).calledWith(round.fullTime.resultKey).mockReturnValue("resultKey");

                // act
                await settleConsumer.settleBets(round);

                // assert
                expect(roundResultPublisherNew.publishRoundResult).toHaveBeenCalledWith({
                    result: round.fullTime.result,
                    settlementResult: round.fullTime.settlementResult,
                    resultKey: "resultKey",
                    roundId: round.id,
                });
            });
        });
    });

    it("calculateBetResult tests", () => {
        // arrange
        const settlementResult = { blue: false, red: false, tie: true, over: true, under: false, odd: false, even: true };
        const bet = { fhBlue: 100, fhRed: 100, fhOver: 100, fhUnder: 100, fhEven: 100, fhOdd: 100 };
        const odds = {
            fhBlue: 1.96,
            fhRed: 1.96,
            fhOver: 1.96,
            fhUnder: 1.96,
            fhOdd: 1.96,
            fhEven: 1.96,
            ftBlue: 1.96,
            ftRed: 1.96,
            ftOver: 1.96,
            ftUnder: 1.96,
            ftOdd: 1.96,
            ftEven: 1.96,
            liveFTOdd: 1.96,
            liveFTEven: 1.96,
            liveFTBlue: 2.03,
            liveFTRed: 1.99,
            liveFTOver: 2.64,
            liveFTUnder: 1.61,
        };

        const expectedResult = {
            totalBetAmount: 600,
            totalWin: 592,
            netWin: 192,
            totalLost: 200,
            refund: 200,
            winningByChoices: {
                fhBlue: 100,
                fhRed: 100,
                fhOver: 196,
                fhUnder: 0,
                fhOdd: 0,
                fhEven: 196,
            },
        };

        // act
        const actualResult = consumer.calculateBetResult(settlementResult, bet, odds, true);

        // assert
        expect(expectedResult).toStrictEqual(actualResult);
    });
});
