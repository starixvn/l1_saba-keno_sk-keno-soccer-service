import { initAPIStub, stubUserService } from "sc-game-service-integration-utils";
import appConfigs from "../../../src/app-configs.IGT";
import gameSettings from "../stubs/game-settings";
import { GameDefinition } from "sc-multiple-games-base";
import MultipleGamesApp from "../../../src/multiple-games-app";

export const run = async () => {
    initAPIStub(appConfigs.apiSettings.apiUrl);
    stubUserService(appConfigs);

    const definitions = gameSettings.map((gameSetting) => new GameDefinition(gameSetting));
    const app = new MultipleGamesApp("Keno Soccer", appConfigs);
    await app.run();
    app.startGames(definitions);
};

run();
