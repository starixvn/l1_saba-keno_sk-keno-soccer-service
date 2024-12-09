import { Core } from "sc-game-base";

import MultipleGamesApp from "../../src/multiple-games-app";

describe("Keno soccer app instance", () => {
    const app = new MultipleGamesApp("Keno Soccer", {});

    it("inherit Core.BaseGameApp", () => {
        expect(app instanceof Core.BaseGameApp).toBeTruthy();
    });
});
