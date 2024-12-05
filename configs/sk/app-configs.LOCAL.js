export default {
    hostingPort: 5000,
    apiSettings: {
        enabledApi: true,
        apiUrl: "http://gn-game-api-local-service:5000",
        authUrl: "http://gn-auth-api-local-service:5000",
        client: {
            id: "game-server",
            secret: "gameserver@20luminet&",
        },
        useAuthenticate: true,
        requestTimeout: 10000,
        placeBetTimeout: 2000,
        enabledApiLogs: true,
    },
    socketOptions: {
        pingInterval: 15000,
        pingTimeout: 5000,
        transports: ["websocket"],
        allowUpgrades: false,
        perMessageDeflate: false,
    },
    enabledLogs: true,
    database: {
        url: "mongodb://lmn_backend:LmnBackend@10.10.50.12:39300,10.10.50.13:39300,10.10.50.14:39300/?replicaSet=GNLocal0&appName=LuckyNext1",
        options: {
            dbName: "minigame",
            useNewUrlParser: true,
            useUnifiedTopology: true,
            auto_reconnect: true,
        },
    },
    sentry: {
        sentryUrl: "https://81e47b9ef0c34ab08c30a8612d9a348e@sentry.lumigame.com/85",
        logIdentifier: "LuckyNext1",
        env: "LOCAL",
    },
    authenticateSettings: {
        url: "http://gn-auth-api-local-service:5000",
        id: "game-services",
        secret: "gameservices@20luminet&",
        requestTimeout: 10000,
        useAuthenticate: true,
        audiences: ["api", "admin-api"],
    },
    userServiceSettings: {
        url: "http://gn-user-service-local-service:5000",
    },
    adminSecretKey: "asWDEerfOIdgsdqRTFabvmgh",
    metrics: {
        enable: true,
        secretKey: "6c1f0f28-70f2-46ae-b031-22624a6cd8df",
    },
    enableMsgpackParser: false,
    gameManagementApiSettings: {
        BASE: "http://gn-game-management-service-local-service:5000",
    },
    disableCors: true,
};
