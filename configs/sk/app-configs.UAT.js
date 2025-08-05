export default {
    hostingPort: 5000,
    apiSettings: {
        enabledApi: true,
        apiUrl: "http://gn-game-api-uat-service:5000",
        authUrl: "http://gn-auth-api-uat-service:5000",
        client: {
            id: "game-server",
            secret: "gameserver@20luminet&",
        },
        useAuthenticate: true,
        placeBetTimeout: 4000,
        requestTimeout: 10000, // 10s
        enabledApiLogs: true,
    },
    authenticateSettings: {
        url: "http://gn-auth-api-uat-service:5000",
        id: "game-services",
        secret: "gameservices@20luminet&",
        requestTimeout: 10000,
        useAuthenticate: true,
        audiences: ["api", "admin-api"],
    },
    userServiceSettings: {
        url: "http://gn-user-service-uat-service:5000",
    },
    socketOptions: {
        pingInterval: 60 * 1000,
        pingTimeout: 60 * 1000,
        transports: ["websocket"],
        allowUpgrades: false,
        perMessageDeflate: false,
    },
    enabledLogs: true,
    database: {
        url: "mongodb://lmn_backend:LmnBackend%4022027@10.146.34.28:39420/?replicaSet=SN-UAT&appName=KenoSoccer",
        options: {
            dbName: "minigame",
            useNewUrlParser: true,
            useUnifiedTopology: true,
            auto_reconnect: true,
        },
    },
    sentry: {
        sentryUrl: "https://f457113be82441879a991096fce8c26c@sentry-ovs.sgamesuat.com/172",
        logIdentifier: "keno-soccer",
        env: "UAT",
    },
    adminSecretKey: "asWDEerfOIdgsdqRTFabvmgh",
    metrics: {
        enable: true,
        secretKey: "6c1f0f28-70f2-46ae-b031-22624a6cd8df",
    },
    enableMsgpackParser: true,
};
