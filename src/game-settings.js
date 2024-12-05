import { choices, choicesMapper } from "./constants";
import { generateResult, getSettlementResult } from "./helpers/result-helper";
import getBetLogsRepository from "./models/bet-logs";
import getBetRepository from "./models/bets";
import getRoundRepository from "./models/rounds";

export const hedgeBetGroups = [
    ["fhBlue", "fhRed"],
    ["fhOver", "fhUnder"],
    ["fhEven", "fhOdd"],
    ["ftBlue", "ftRed"],
    ["ftOver", "ftUnder"],
    ["ftEven", "ftOdd"],
    ["liveFTEven", "liveFTOdd"],
];

export default [
    {
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
        hedgeBetGroups,
        defaultBetTracks: {},
        repositories: {
            roundsRepository: getRoundRepository("kenomatch1_phien"),
            betsRepository: getBetRepository("kenomatch1_one"),
            betLogsRepository: getBetLogsRepository("kenomatch1_cuoc"),
        },
        generateResult,
        settle: getSettlementResult,
    },
    {
        id: 1512,
        name: "KenoMatch2",
        durations: {
            wholeRound: 85,
            firstHalfPlacingBets: 73,
            firstHalfLockingBet: 43,
            finishFirstHalf: 38,
            placingBets: 25,
            lockingBet: 5,
        },
        choices,
        choicesMapper,
        hedgeBetGroups,
        defaultBetTracks: {},
        repositories: {
            roundsRepository: getRoundRepository("kenomatch2_phien"),
            betsRepository: getBetRepository("kenomatch2_one"),
            betLogsRepository: getBetLogsRepository("kenomatch2_cuoc"),
        },
        generateResult,
        settle: getSettlementResult,
    },
];
