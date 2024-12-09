const game = {
    id: 1511,
    name: "kenosoccer",
};

const currencyData = { code: "USD", name: "$US" };

const socketOptions = {
    socketUri: `http://localhost:8089/user/${game.name}`,
    gameName: "KenoSoccer",
    proxyRoute: "/socket.io",
};

const gameConfig = {
    gameId: game.id,
    name: game.name,
    enabled: true,
    minBet: 1,
    maxBet: 3000,
    maxBetPerChoices: {
        fhBlue: 3000,
        fhRed: 3000,
        fhOver: 2000,
        fhUnder: 2000,
        fhOdd: 2000,
        fhEven: 2000,
        ftBlue: 2000,
        ftRed: 2000,
        ftOver: 2000,
        ftUnder: 2000,
        ftOdd: 2000,
        ftEven: 2000,
        liveFTOdd: 2000,
        liveFTEven: 2000,
    },
    chips: [],
    stakeLevels: [],
    type: 1,
    botenabled: true,
    bot_maxbet: 10,
    hour_maxbot: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    odds: {
        fhBlue: 1.95,
        fhRed: 1.95,
        fhOver: 1.95,
        fhUnder: 1.95,
        fhOdd: 1.95,
        fhEven: 1.95,
        ftBlue: 1.95,
        ftRed: 1.95,
        ftOver: 1.95,
        ftUnder: 1.95,
        ftOdd: 1.95,
        ftEven: 1.95,
        liveFTOdd: 1.95,
        liveFTEven: 1.95,
    },
};

const rounds = [
    {
        settled: true,
        id: 1,
        odds: {
            fhBlue: 1.95,
            fhRed: 1.95,
            fhOver: 1.95,
            fhUnder: 1.95,
            fhOdd: 1.95,
            fhEven: 1.95,
            ftBlue: 1.95,
            ftRed: 1.95,
            ftOver: 1.95,
            ftUnder: 1.95,
            ftOdd: 1.95,
            ftEven: 1.95,
            liveFTOdd: 1.95,
            liveFTEven: 1.95,
            liveFTBlue: 4.2,
            liveFTRed: 1.25,
        },
        firstHalf: {
            md5: "b4f4497e65557aac95083703cd2dba3d",
            resultKey: {
                iv: "4b49d23ca4c57f8e2c19a6367e67024c",
                content: "4bb246daacd50e32ad74797e458dedfef0a198070041dd1bbaede0d84e3e123409456e0731c6db57",
            },
            encryptedResult: {
                iv: "d9401627cb26ffa6fbec44c581470d38",
                content:
                    "42a4915023fee089238313d3b685968f9afdeb1ee0631032c5cdb2387bc081f6c41f01c28b817c09461eb8462d82ccf5beafc8e394e1b89c563d079757de6f02fe59ae266ef805c2c45a97379c",
            },
            result: {
                blue: [7, 35, 39, 40, 45, 48, 51, 59, 67, 76],
                red: [15, 18, 45, 55, 61, 62, 66, 73, 77, 80],
            },
            settlementResult: {
                blue: false,
                red: true,
                tie: false,
                over: true,
                under: false,
                odd: true,
                even: false,
            },
            sum: 1019,
        },
        exchangeRateId: 2681,
        fullTime: {
            result: {
                blue: [3, 18, 21, 24, 25, 29, 32, 36, 47, 62],
                red: [19, 23, 34, 41, 44, 48, 49, 60, 63, 67],
            },
            settlementResult: {
                blue: false,
                red: true,
                tie: false,
                over: true,
                under: false,
                odd: false,
                even: true,
            },
            sum: 1764,
            md5: "6e334489543289230efb14926148a61c",
            resultKey: {
                iv: "d5978c98efc4baf42aad44b7da9a6eaf",
                content: "43c2dd2fdde618c1bdd0136ae48a6dc9ebc70db77b4699f05c218fcc0a272f32d01c213386a762522d",
            },
            encryptedResult: {
                iv: "6d480b6d7d3c6c21a29d96c6433654bf",
                content:
                    "4316b2dc1605c36c17570b1f5beb513effc36efe98e84236915f370618409fed0056280ed9cbec660702f336065b3f82381046c0fc26ac66ebbb86b16dbe70eed88164eba6abd6a35cd265e1fc",
            },
        },
    },
    {
        settled: true,
        id: 2,
        odds: {
            fhBlue: 1.95,
            fhRed: 1.95,
            fhOver: 1.95,
            fhUnder: 1.95,
            fhOdd: 1.95,
            fhEven: 1.95,
            ftBlue: 1.95,
            ftRed: 1.95,
            ftOver: 1.95,
            ftUnder: 1.95,
            ftOdd: 1.95,
            ftEven: 1.95,
            liveFTOdd: 1.95,
            liveFTEven: 1.95,
            liveFTBlue: 4.2,
            liveFTRed: 1.25,
        },
        firstHalf: {
            md5: "b4f4497e65557aac95083703cd2dba3d",
            resultKey: {
                iv: "4b49d23ca4c57f8e2c19a6367e67024c",
                content: "4bb246daacd50e32ad74797e458dedfef0a198070041dd1bbaede0d84e3e123409456e0731c6db57",
            },
            encryptedResult: {
                iv: "d9401627cb26ffa6fbec44c581470d38",
                content:
                    "42a4915023fee089238313d3b685968f9afdeb1ee0631032c5cdb2387bc081f6c41f01c28b817c09461eb8462d82ccf5beafc8e394e1b89c563d079757de6f02fe59ae266ef805c2c45a97379c",
            },
            result: {
                blue: [7, 35, 39, 40, 45, 48, 51, 59, 67, 76],
                red: [15, 18, 45, 55, 61, 62, 66, 73, 77, 80],
            },
            settlementResult: {
                blue: false,
                red: true,
                tie: false,
                over: true,
                under: false,
                odd: true,
                even: false,
            },
            sum: 1019,
        },
        exchangeRateId: 2681,
        fullTime: {
            result: {
                blue: [3, 18, 21, 24, 25, 29, 32, 36, 47, 62],
                red: [19, 23, 34, 41, 44, 48, 49, 60, 63, 67],
            },
            settlementResult: {
                blue: false,
                red: true,
                tie: false,
                over: true,
                under: false,
                odd: false,
                even: true,
            },
            sum: 1764,
            md5: "6e334489543289230efb14926148a61c",
            resultKey: {
                iv: "d5978c98efc4baf42aad44b7da9a6eaf",
                content: "43c2dd2fdde618c1bdd0136ae48a6dc9ebc70db77b4699f05c218fcc0a272f32d01c213386a762522d",
            },
            encryptedResult: {
                iv: "6d480b6d7d3c6c21a29d96c6433654bf",
                content:
                    "4316b2dc1605c36c17570b1f5beb513effc36efe98e84236915f370618409fed0056280ed9cbec660702f336065b3f82381046c0fc26ac66ebbb86b16dbe70eed88164eba6abd6a35cd265e1fc",
            },
        },
    },
];

const userBetData = (uid) => {
    return [
        {
            uid,
            name: "NormalUser",
            choice: "fhOdd",
            amount: 100,
            roundId: 363310,
            siteId: "111",
            currency: "$US",
            rate: 1,
            operatorId: "dummy-operator-id",
            playerId: 2609,
        },
        {
            uid,
            name: "NormalUser",
            choice: "fhOdd",
            amount: 100,
            roundId: 363310,
            siteId: "111",
            currency: "$US",
            rate: 1,
            operatorId: "dummy-operator-id",
            playerId: 2609,
        },
    ];
};

export { game, currencyData, socketOptions, gameConfig, rounds, userBetData };
