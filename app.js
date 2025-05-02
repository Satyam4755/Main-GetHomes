require('dotenv').config();
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Routers wala part
const userRouter = require('./routes/user');
const authRouter = require('./routes/auth');
const { hostRouter } = require('./routes/host');

// Middleware imports wala part
const createSession = require('./middleware/session');
const loginFlag = require('./middleware/loginFlag');
const protectUserRoutes = require('./middleware/protectUserRoutes');
const protectHostRoutes = require('./middleware/protectHostRoutes');

// Env variables...
const dbPath = process.env.MONGO_URI;
const sessionSecret = process.env.SESSION_SECRET;
const PORT = process.env.PORT || 3000;

// Middleware usage:-
app.use(createSession(dbPath, sessionSecret));
app.use(loginFlag);
app.use(express.static(path.join(__dirname, 'public')));

// Protected user routes
const chekingRoutes = [
    '/user/favourite_list',
    '/user/reserve',
    '/user/booking/:homeId',
    '/user/submit_booking'
];
app.use(chekingRoutes, protectUserRoutes);

// Routes
app.use(userRouter);
app.use(authRouter);

// Protected host routes
app.use('/host', protectHostRoutes, hostRouter);

// View engine
app.set('view engine', 'ejs');
app.set('views', 'views');

// 404 handler
app.use((req, res) => {
    res.status(404).render('error', { title: "error", isLogedIn: req.isLogedIn });
});

// DB connection
mongoose.connect(dbPath).then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
        console.log(`Server started at port ${PORT}`);
    });
});