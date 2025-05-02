const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);

const createSession = (dbPath, sessionSecret) => {
    const store = new MongoDBStore({
        uri: dbPath,
        collection: 'sessions'
    });

    return session({
        secret: sessionSecret,
        resave: false,
        saveUninitialized: true,
        store: store
    });
};

module.exports = createSession;