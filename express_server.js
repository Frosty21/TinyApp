const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const cookieSession = require('cookie-session');
const methodOverride = require('method-override');
const dotenv = require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

const users = {};
const urlDatabase = {};

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(methodOverride('_method'));
app.use(cookieParser());
app.use(cookieSession({
    name: 'session',
    keys: [process.env.SESSION_SECRET || 'tiny-development']
}));

// -------------------- res locals variables ----------------------
app.use(function(req, res, next) {
    res.locals.email = '';
    if (users[req.session.userId]) {
        res.locals.email = users[req.session.userId].email;
    }
    next();
});

// -------------------- Helper Functions ----------------------
function generateHash() {
    const short = [];
    const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (var i = 0; i < 6; i++) {
        short[i] = chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return (short.join(''));
}

// -------------------- Functions ----------------------
function urlsForUser(id) {
    return Object.keys(urlDatabase).map(id => urlDatabase[id]).filter((url) => {
        return url.owner === id;
    });
}

function getUserPass(testEmail, testPass) {
    for (var item in users) {
        if (users[item].email === testEmail && bcrypt.compareSync(testPass, users[item].password)) {
            return users[item].id;
        }
    }
    return false;
}

function checkUserLoggedIn(req, res, next) {
    if (!res.locals.email) {
        res.status(401).send(`Not logged in.<br>Please go back and <a href="/login">Login</a> first!`);
        return;
    }
    next();
}

function checkShortURL(req, res, next) {
    if (!(urlDatabase.hasOwnProperty(req.params.id)) && !(urlDatabase.hasOwnProperty(req.params.shortURL))) {
        res.status(404).send("Not found ShortURL<br>This ShortURL does not exist.");
        return;
    }
    next();
}

function checkShortUrlOwner(req, res, next) {
    if (urlDatabase[req.params.id].owner !== req.session.userId) {
        res.status(403).send("Unauthorized: you are not the owner of this ShortURL.");
        return;
    }
    next();
}

const checkNewUrlAndAdd = (longURL) => {
    if (!longURL.startsWith("http://") && !longURL.startsWith("https://")) {
        return `http://${longURL}`;
    } else {
        return longURL;
    }
};

function validateEmail(email) {
    const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

//------------------------ GETS ------------------------------
//Redirect from root
app.get("/", (req, res) => {
    if (res.locals.email) {
        res.redirect("/urls");
    } else {
        res.redirect("/login");
    }
});

//Get register route
app.get("/register", (req, res) => {
    if (res.locals.email) {
        res.redirect("/");
    } else {
        res.render("register");
    }
});

//Get login route
app.get("/login", (req, res) => {
    if (res.locals.email) {
        res.redirect("/");
    } else {
        res.render("login");
    }
});

//Show urls index
app.get("/urls", checkUserLoggedIn, (req, res) => {
    if (res.locals.email) {
        res.render("urls_index", res.locals.urls = urlsForUser(req.session.userId));
    }
});

//New URL form
app.get("/urls/new", checkUserLoggedIn, (req, res) => {
    if (res.locals.email) {
        res.render("urls_new");
    }
});

//Redirect user to the long URL to which a shortened URL is assigned
app.get("/u/:shortURL", checkShortURL, (req, res) => {
    let alias = urlDatabase[req.params.shortURL];
    if (!req.cookies.visitorId) {
        res.cookie("visitorId", generateHash());
    }
    res.redirect(302, alias.url);
    alias.visits++;
    if (!alias.visitLog[req.cookies.visitorId]) {
        alias.visitLog[req.cookies.visitorId] = [];
        alias.uniqueVisits++;
    }
    alias.visitLog[req.cookies.visitorId].push(new Date());
});

//GET individual URL page (with update form)
app.get("/urls/:id", checkShortURL, checkUserLoggedIn, checkShortUrlOwner, (req, res) => {
    res.render("urls_show", {
        url: urlDatabase[req.params.id]
    });
});

// ------------------------ POSTS ------------------------------
//POST register route
app.post("/register", (req, res) => {
    for (let list in users) {
        if (users[list]['email'] === req.body.email) {
            res.status(400).send("Email already in use.");
            return;
        }
    }
    if (!validateEmail(req.body.email) || !req.body.password) {
        res.status(400).send("Specify correctly both your email and a password.");
    } else {
        let userID = generateHash();
        if (users[userID]) {
            while (users[userID]) {
                userID = generateHash();
            }
        }
        users[userID] = {
            "id": userID,
            "email": req.body.email,
            "password": bcrypt.hashSync(req.body.password, 10)
        };
        req.session.userId = userID;
        res.redirect("/");
    }
});

//Login route
app.post("/login", (req, res) => {
    let email = req.body.email;
    let password = req.body.password;
    let existingUser = getUserPass(email, password);
    if (!existingUser) {
        res.status(403).send("Incorrect credentials");
    } else {
        req.session.userId = existingUser;
        res.redirect("/");
    }
});

//Create new url
app.post("/urls", (req, res) => {
    let shortURL = generateHash();
    while (urlDatabase[shortURL]) {
        shortURL = generateHash();
    }
    urlDatabase[shortURL] = {
        "id": shortURL,
        "owner": req.session.userId,
        "url": checkNewUrlAndAdd(req.body.longURL),
        "created": new Date(),
        "visits": 0,
        "visitLog": {}
    };
    res.redirect(`/urls/${shortURL}`);
});

//Logout route
app.post("/logout", (req, res) => {
    req.session = null;
    res.redirect("/");
});

const server = app.listen(port, () => {
    const address = server.address();
    console.log(`Server listening on ${address.port}`);
});

// ------------------------ PUTS ------------------------------
//Update an existing URL
app.put("/urls/:id", checkShortURL, checkUserLoggedIn, checkShortUrlOwner, (req, res) => {
    urlDatabase[req.params.id].url = checkNewUrlAndAdd(req.body.longURL);
    res.redirect("/urls");
});

// ------------------------ DELETES ------------------------------
//Delete a URL combo
app.delete("/urls/:id/delete", (req, res) => {
    if (urlDatabase[req.params.id].owner === req.session.userId) {
        delete urlDatabase[req.params.id];
        res.redirect("/urls");
    }
});