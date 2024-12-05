import { stub } from "jest-micro-auto-stub";
import { helpers } from "sc-common";
import { Core } from "sc-game-base";

import { choices, choicesMapper, liveChoices, preLiveChoices } from "../../../src/constants";
import { GameData } from "../../../src/game-data";
import { PlaceBetConsumer } from "../../../src/consumers/place-bet-consumer";

describe("Place Bet consumer instance", () => {
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
    gameData.roundId = 1;
    gameData.gameConfigs = { maxbet: 2000, odds: { fhBlue: 1.96 } };
    gameData.liveOdds = {};
    const baseEventPublisher = stub(Core.BaseEventPublishers.BaseEventPublisher);
    const consumer = new PlaceBetConsumer(definition, gameData, baseEventPublisher);
    const realPlayer = {
        socketClient: {
            emit: jest.fn(),
        },
        profile: {
            name: "player01",
        },
        session: {
            currencyGroupId: "1",
        },
    };

    beforeAll(() => {
        // arrange
        spyOn(Core.BaseEventConsumers.PlaceBetConsumer.prototype, "composeBetChoiceValidationCriteria").and.callFake(() => []);
    });

    it("should extends Core PlaceBetConsumer", () => {
        // assert
        expect(consumer instanceof Core.BaseEventConsumers.PlaceBetConsumer).toBeTruthy();
    });

    describe("composeBettingTimeValidationCriteria tests", () => {
        beforeEach(() => {
            gameData.remainingTime = 0;
            gameData.roundId = 1;
            gameData.gameConfigs = { enabled: true, maxbet: 2000, odds: { fhBlue: 1.96 } };
            gameData.liveOdds = {};
        });

        it("should return invalidBet notice when game was disabled", () => {
            // arrange
            gameData.gameConfigs.enabled = false;

            // act
            var actualResult = consumer.composeBettingTimeValidationCriteria(1);

            // assert
            expect(actualResult.filter((x) => x.failure)[0]).toStrictEqual({
                failure: true,
                notice: { errorCode: helpers.noticeHelper.invalidBet },
            });
        });

        it("should return invalidBet notice when round id is different with running round", () => {
            // arrange
            gameData.roundId = 2;

            // act
            var actualResult = consumer.composeBettingTimeValidationCriteria(1);

            // assert
            expect(actualResult.filter((x) => x.failure)[0]).toStrictEqual({
                failure: true,
                notice: { errorCode: helpers.noticeHelper.invalidBet, gameRoundId: 1 },
            });
        });

        [70, 38, 4].forEach((remainingTime) => {
            it(`should return placeBetNextRound when placing bet in invalid time (${remainingTime})`, () => {
                // arrange
                gameData.remainingTime = remainingTime;

                // act
                var actualResult = consumer.composeBettingTimeValidationCriteria(1);

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
                var actualResult = consumer.composeBettingTimeValidationCriteria(1);

                // assert
                expect(actualResult.filter((x) => x.failure).length).toBe(0);
            });
        });
    });

    describe("composeBetChoiceValidationCriteria tests", () => {
        it("should call super.composeBetChoiceValidationCriteria", () => {
            // act
            consumer.composeBetChoiceValidationCriteria("fhBlue");

            // assert
            expect(Core.BaseEventConsumers.PlaceBetConsumer.prototype.composeBetChoiceValidationCriteria).toHaveBeenCalled();
        });

        liveChoices.forEach((choice) => {
            it(`should return invalid bet when placing bet live choice (${choice}) in first half duration`, () => {
                //arrange
                gameData.remainingTime = 50;

                // act
                var actualResult = consumer.composeBetChoiceValidationCriteria(choice);

                // assert
                expect(actualResult.filter((x) => x.failure)[0]).toStrictEqual({
                    failure: true,
                    notice: { errorCode: helpers.noticeHelper.invalidBet },
                });
            });
        });

        preLiveChoices.forEach((choice) => {
            it(`should return invalid bet when placing bet pre-live choice (${choice}) in full time duration`, () => {
                //arrange
                gameData.remainingTime = 15;

                // act
                var actualResult = consumer.composeBetChoiceValidationCriteria(choice);

                // assert
                expect(actualResult.filter((x) => x.failure)[0]).toStrictEqual({
                    failure: true,
                    notice: { errorCode: helpers.noticeHelper.invalidBet },
                });
            });
        });
    });

    describe("composeBetAmountValidationCriteria tests", () => {
        const baseCriteria = [
            {
                failure: false,
                notice: { errorCode: "SB1234" },
            },
        ];
        beforeEach(() => {
            // arrange
            spyOn(Core.BaseEventConsumers.PlaceBetConsumer.prototype, "composeBetAmountValidationCriteria").and.callFake(
                () => baseCriteria
            );
        });

        it("should return baseCriteria when betChoice is preLive", () => {
            // act
            const actualResult = consumer.composeBetAmountValidationCriteria(realPlayer, "fhBlue", 100, false);

            // assert
            expect(actualResult).toStrictEqual(baseCriteria);
        });

        it("should return correct result when betChoice is live", () => {
            // arrange
            gameData.liveOdds = { liveFTBlue: 4.2 };
            gameData.currencyGroupGames = [
                {
                    groupId: 1,
                    minBet: 1,
                    maxBet: 2000,
                },
            ];
            const expectedResult = [
                { failure: false, notice: { errorCode: helpers.noticeHelper.maxBetForChoice, maxBet: 625 } },
                {
                    failure: false,
                    notice: { errorCode: "SB1234" },
                },
            ];
            // act
            const actualResult = consumer.composeBetAmountValidationCriteria(realPlayer, "liveFTBlue", 100, false);

            // assert
            expect(actualResult).toStrictEqual(expectedResult);
        });
    });
});
