import { generateResult, getSettlementResult } from "../../../src/helpers/result-helper";
import { choices, choicesMapper } from "../../../src/constants";
import { hedgeBetGroups } from "../../../src/game-settings";
import getRoundRepository from "../../../src/models/rounds";
import getBetRepository from "../../../src/models/bets";
import getBetLogsRepository from "../../../src/models/bet-logs";

export default [
    {
        id: 1511,
        name: "SkKenoSoccer",
        durations: {
            wholeRound: 30,
            firstHalfPlacingBets: 28,
            firstHalfLockingBet: 22,
            finishFirstHalf: 19,
            placingBets: 15,
            lockingBet: 5,
        },
        choices,
        choicesMapper,
        hedgeBetGroups,
        defaultBetTracks: {},
        repositories: {
            roundsRepository: getRoundRepository("kenosoccer_phien"),
            betsRepository: getBetRepository("kenosoccer_one"),
            betLogsRepository: getBetLogsRepository("kenosoccer_cuoc"),
        },
        generateResult,
        settle: getSettlementResult,
    },
];
