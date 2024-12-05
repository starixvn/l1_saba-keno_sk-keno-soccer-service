import { asClass, asValue } from "awilix";
import { MultipleGamesContainerRegistry } from "sc-multiple-games-base";

import { AdminMonitorConsumer, InGameConsumer, PlaceBetConsumer, RoundResultConsumer, SettleGameRoundConsumer } from "./consumers";
import { GameCron, ProcessBetQueue } from "./crons";
import globalConfigs from "./models/global-configs";
import { RoundResultPublisher } from "./publishers";
import { HistoryQuery, RoundQuery } from "./query-apis";

export default class KenoSoccerContainerRegistry extends MultipleGamesContainerRegistry {
    /**
     * @param {object} appConfigs
     * @param {GameDefinition} definition
     * @param {GameData} gameData
     */
    register(appConfigs, definition, gameData) {
        super.register(appConfigs, definition, gameData);

        this.registerRepositories(definition.repositories);

        return this.container;
    }

    registerModels() {
        super.registerModels();

        this.container.register({
            globalConfigsRepository: asValue(globalConfigs),
        });
    }

    registerRepositories(repositories) {
        this.container.register({
            roundsRepository: asValue(repositories.roundsRepository),
            betsRepository: asValue(repositories.betsRepository),
            betLogsRepository: asValue(repositories.betLogsRepository),
            tempBetsRepository: asValue(repositories.tempBetsRepository),
        });
    }

    registerCrons() {
        super.registerCrons();

        this.container.register({
            gameCron: asClass(GameCron).singleton().proxy(),
            processBetQueue: asClass(ProcessBetQueue).singleton().proxy(),
        });
    }

    registerConsumers() {
        super.registerConsumers();

        this.container.register({
            inGameConsumer: asClass(InGameConsumer).singleton(),
            placeBetConsumer: asClass(PlaceBetConsumer).singleton(),
            settleGameRoundConsumer: asClass(SettleGameRoundConsumer).singleton().proxy(),
            adminMonitorConsumer: asClass(AdminMonitorConsumer).singleton(),
            roundResultConsumer: asClass(RoundResultConsumer).singleton(),
        });
    }

    registerPublishers() {
        super.registerPublishers();

        this.container.register({
            roundResultPublisher: asClass(RoundResultPublisher).singleton(),
        });
    }

    registerApis() {
        super.registerApis();
        this.container.register({
            roundQuery: asClass(RoundQuery).singleton(),
            historyQuery: asClass(HistoryQuery).singleton(),
        });
    }
}
