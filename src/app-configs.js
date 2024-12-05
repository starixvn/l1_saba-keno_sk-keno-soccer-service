export default {
    hostingPort: 8089,
    apiSettings: {
        enabledApi: true,
        apiUrl: "http://api.lumigame.com",
        authUrl: "http://auth.lumigame.com",
        client: {
            id: "game-server",
            secret: "gameserver@20luminet&",
        },
        useAuthenticate: true,
        requestTimeout: 10000,
        placeBetTimeout: 4000,
        enableApiLogs: true,
    },
    authenticateSettings: {
        url: "http://auth.lumigame.com",
        id: "game-services",
        secret: "gameservices@20luminet&",
        requestTimeout: 10000,
        useAuthenticate: false,
        audiences: ["api", "admin-api"],
    },
    userServiceSettings: {
        url: "http://127.0.0.1:5000",
    },
    socketOptions: {
        pingInterval: 60 * 1000,
        pingTimeout: 60 * 1000,
        transports: ["websocket"],
        allowUpgrades: false,
    },
    enabledLogs: true,
    database: {
        url: "mongodb://127.0.0.1:27017",
        options: {
            dbName: "minigame",
            useNewUrlParser: true,
            useUnifiedTopology: true,
            auto_reconnect: true,
        },
    },
    sentry: {
        sentryUrl: "https://c9800a77cde44628ae983c6dfabfc7d9@sentryuat.sabagame.com/113",
        logIdentifier: "keno-soccer",
        env: "LOCAL",
    },
    adminSecretKey: "asWDEerfOIdgsdqRTFabvmgh",
    metrics: {
        enable: true,
        secretKey: "6c1f0f28-70f2-46ae-b031-22624a6cd8df",
    },
};
