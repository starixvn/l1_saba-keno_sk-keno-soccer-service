export default {
    hostingPort: 5000,
    apiSettings: {
        enabledApi: true,
        apiUrl: "http://gn_game_api_prod:5000",
        authUrl: "http://gn_auth_api_prod:5000",
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
        url: "http://gn_auth_api_prod:5000",
        id: "game-services",
        secret: "gameservices@20luminet&",
        requestTimeout: 10000,
        useAuthenticate: true,
        audiences: ["api", "admin-api"],
    },
    userServiceSettings: {
        url: "http://gn_user_service_prod:5000",
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
        url: "mongodb://lmn_backend:Q74~T0vK6%25gMO%3AII%60L%5DMxc%2CR%5E%28IhxpAt@10.99.99.53:39410,10.99.99.54:39410,10.99.99.188:39410,10.99.99.187:39410/?replicaSet=SN-Main&appName=KenoMatch",
        options: {
            dbName: "minigame",
            useNewUrlParser: true,
            useUnifiedTopology: true,
            auto_reconnect: true,
        },
    },
    sentry: {
        sentryUrl: "http://f457113be82441879a991096fce8c26c@10.2.189.50:9009/172",
        logIdentifier: "keno-match",
        env: "PROD",
    },
    adminSecretKey: "asWDEer4yGdgsdqR4uqmKQZgh",
    metrics: {
        enable: true,
        secretKey: "30d15293-c7de-4c77-9293-b85d6c5bfe1a",
    },
    enableMsgpackParser: true,
};
