const express = require('express');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const path = require('path');
const ejsMate = require('ejs-mate');
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
const passportLocal = require('passport-local');
const User = require('./models/user');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const MongoDBStore = require('connect-mongo');

//Add the dotenv package if we're in development
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
};

//Error Handling
const ExpressError = require('./utils/ExpressError');

//Express Routes
const bothyRoutes = require('./routes/bothies');
const reviewRoutes = require('./routes/reviews');
const userRoutes = require('./routes/users');

const app = express();

//mongodb localhost database or mongodb atlas database
let dbUrl = process.env.DB_URL || 'mongodb://127.0.0.1:27017/bothy-camp';

//Connect to the mongo database
mongoose.set('strictQuery', false);
mongoose.connect(dbUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).catch(e => console.log(e));

//Connect to the database
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
    console.log('Database connected');
});

//Use the ejs-mate node package for ejs files
app.engine('ejs', ejsMate);

//Set the view engine to ejs
app.set('view engine', 'ejs');
//Serve the EJS files from the 'views' folder
app.set('views', path.join(__dirname, 'views'));

//Ensure we can send the form data through a URL
app.use(express.urlencoded({extended: true}));
//Allows DELETE and other methods
app.use(methodOverride("_method"));
//Javascript and CSS files are in subfolders within 'public'
app.use(express.static(path.join(__dirname, 'public')));
//Sanitize user inputs with Express Mongo Sanitize
app.use(mongoSanitize());

const secret = process.env.SECRET || 'thisshouldbeabettersecret!';

//MongoDB store for storing session data
const store = new MongoDBStore({
    mongoUrl: dbUrl,
    secret,
    touchAfter: 24 * 60 * 60
});
store.on('error', function(e){
    console.log("Session Store Error", e);
});

//Express Session config
const sessionConfig = {
    store,
    name: 's_e_s_s_i_o_n',
    secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        //secure: true,
        //One week
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
};

//Express Session for storing cookies
//Use before passport.session
app.use(session(sessionConfig));

//Connect Flash for flashing messages on screen for the user
app.use(flash());

//Helmet npm package for content security etc.
//Helmet accepted urls / resources
const fontSrcUrls = [];
const connectSrcUrls = [
    "https://api.mapbox.com/",
    "https://a.tiles.mapbox.com/",
    "https://b.tiles.mapbox.com/",
    "https://events.mapbox.com/",
];
const scriptSrcUrls = [
    "https://stackpath.bootstrapcdn.com/",
    "https://api.tiles.mapbox.com/",
    "https://api.mapbox.com/",
    "https://kit.fontawesome.com/",
    "https://code.jquery.com/",
    "https://cdnjs.cloudfare.com/",
    "https://cdn.jsdelivr.net/",
];
const styleSrcUrls = [
    "https://kit-free.fontawesome.com/",
    "https://stackpath.bootstrapcdn.com/",
    "https://api.mapbox.com/",
    "https://api.tiles.mapbox.com/",
    "https://fonts.googleapis.com/",
    "https://use.fontawesome.com/",
    "https://cdn.jsdelivr.net/",
];
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: [],
            connectSrc: ["'self'", ...connectSrcUrls],
            scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
            styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
            workerSrc: ["'self'", "blob:"],
            objectSrc: [],
            imgSrc: [
                "'self'",
                "blob:",
                "data:",
                "https://res.cloudinary.com/dawmapayb/",
                "https://images.unsplash.com/",
                "https://source.unsplash.com/",
            ],
            fontSrc: ["'self'", ...fontSrcUrls],
        },
    })
);

//Passport for logging in etc
app.use(passport.initialize());

//Persistent login sessions
app.use(passport.session());

//Passport local strategy for logging in
passport.use(new passportLocal(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//Middleware for flashing messages to user with Connect Flash
app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
});

//Express Routes
app.use('/', userRoutes);
app.use('/bothies', bothyRoutes);
app.use('/bothies/:id/reviews', reviewRoutes);

//Index page
app.get('/', (req, res) => {
    res.render('home');
});

//Error handling for page not found
app.all('*', (req, res, next) => {
    return next(new ExpressError('Page Not Found', 404));
});

//Error handling for specific error codes
app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) {
        err.message = 'Something went wrong';
    }
    res.status(statusCode).render('error', { err });
});

//Port for fly.io is 8080
const port = process.env.PORT || 8080;

//Start up the server
app.listen(port, () => {
    console.log(`Serving on port ${port}`);
});