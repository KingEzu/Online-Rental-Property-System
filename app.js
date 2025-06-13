require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const morgan = require('morgan');
const ejsLayouts = require('express-ejs-layouts');
const corsOptions = require('./config/cors_options');
const { logger } = require('./middlewares/log_events');
const errorHandler = require('./middlewares/error_handler');
const cookieParser = require('cookie-parser');
const credentials = require('./middlewares/credentials');
const {verifyUserSession} = require('./middlewares/verify_user_session');
const verifyActive = require('./middlewares/verify_active');
const requestCache = require('./config/log_cache_config');
const statusMonitor = require('express-status-monitor');

app.use(express.static('public'));
app.use(ejsLayouts);
app.use(statusMonitor()); 
app.set('view engine', 'ejs');
app.set('views', __dirname+'/views');
app.set('layout', './layouts/index');

const auth = require('./routes/auth');
const listing = require('./routes/listing');
const user = require('./routes/user');
const admin = require('./routes/admin');
const account = require('./routes/account');
const review = require('./routes/review');
const reservation = require('./routes/reservation');
const notification = require('./routes/notification');
const payment = require('./routes/payment');
const PORT = process.env.PORT || 4000;

app.use(logger);
const morganMw = morgan('combined', {
stream: {
    write: (message) => {
    const logEntry = {
        timestamp: new Date().toISOString(),
        log: message.trim(),
    };
    const key = `log_${Date.now()}`;
    requestCache.set(key, logEntry);
    },
  },
});

// app.use(credentials);
// app.use(cors(corsOptions));
app.use(morganMw);
app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());

app.get('/', (req, res) => res.status(200).send("GOD DID!"));
app.use('/admin', admin);
app.use('/auth', auth);
app.use('/listing', verifyUserSession, verifyActive, listing);
app.use('/user', verifyUserSession, verifyActive, user);
app.use('/review', verifyUserSession, verifyActive, review);
app.use('/reservation',  verifyUserSession, verifyActive, reservation);
app.use('/payment', payment);
app.use('/account', account);
app.use('/notification',  verifyUserSession, verifyActive, notification);

app.use(errorHandler);
app.listen(PORT, () => console.log("SERVER RUNNIG AT PORT : " + PORT));
