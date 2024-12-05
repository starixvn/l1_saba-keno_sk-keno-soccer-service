import { MultipleGamesContainerRegistry } from "sc-multiple-games-base";

import KenoSoccerContainerRegistry from "../../src/keno-match-container-registry";

describe("keno-match-container-registry", () => {
    describe("extends", () => {
        it("inherit MultipleGamesContainerRegistry", () => {
            // arrange
            const serviceContainerRegistry = new KenoSoccerContainerRegistry();

            //assert
            expect(serviceContainerRegistry instanceof MultipleGamesContainerRegistry);
        });
    });
});
