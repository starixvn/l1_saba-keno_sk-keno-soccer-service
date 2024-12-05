import { MultipleGamesContainerRegistry } from "sc-multiple-games-base";

import KenoSoccerContainerRegistry from "../../src/keno-soccer-container-registry";

describe("keno-soccer-container-registry", () => {
    describe("extends", () => {
        it("inherit MultipleGamesContainerRegistry", () => {
            // arrange
            const serviceContainerRegistry = new KenoSoccerContainerRegistry();

            //assert
            expect(serviceContainerRegistry instanceof MultipleGamesContainerRegistry);
        });
    });
});
