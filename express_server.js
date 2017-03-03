const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const methodOverride = require("method-override");
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const request = require('request');
const bcrypt = require('bcrypt');
const saltRounds = 10;
app.set("view engine", "ejs");
app.use(express.static('public'));

app.set('trust proxy', 1);
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(cookieParser());
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2'],
  maxAge: 24 * 60 * 60 * 1000
}));

// listen on port.
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

// urlDatabase object contains short and long url data for a given user.
// users object contains the user credentials.

// urlDatabase contains {shortURL : {longURL, dateCreated: new Date(), vistis:, uniqueVisits:, vistorId:, vistorIp, visitorAgent:}} example
// "b2xVn2": { id: "http://www.lighthouselabs.ca",
//             url: "http://www.lighthouselabs.ca"
//             userid: 'Lydia',
//             dateCreated: '2017-09-11',
//             views: '0',
//             dateCreated: [],
//             vistorId: [],
//             vistorIp: [],
//             vistorAgent: [],
//             },


const urlDatabase = {};
// users containss UsersRandomID : {id:, email:, password:} example
//   "userRandomID": {
//     id: "userRandomID",
//     email: "user@example.com",
//     password: "purple-monkey-dinosaur"
//   }

const users = {};

app.use((req, res, next) => {
  res.locals.useremail = users[req.session.userID]
    ? req.session.useremail
    : null;
  res.locals.urls = urlDatabase;
  // res.locals.userID = res.session.userID;
  console.log(res.locals.urls);
  next();
});

// -------------------- Global Functions ----------------------
// fcn renders login page if user has not logged in.
function checkIfLoggedIn(req, res, path) {
  console.log(res.locals);
  if (!req.session.userID) {
    res.status(401).send(
      "Please go back and <a href='/login'>log-in</a> first!");
  }
}

// fcn urls index if url list does not exist yet
function checkForUrlData(req, res) {
  if (urlDatabase[req.session.userID] !== undefined) {
    let templateVars = {
      urls: urlDatabase[req.session.userID],
      userID: req.session.userID

    };
  } else {
    res.statusCode = 404;
    res.render("urls/index", templateVars);
  }
}

// fcn checks for valid http/https url when adding or editting a url
var checkNewUrlAndAdd = (url, user, urlDataBaseKey, redirectUrl, res) => {
  let tempUrl = url;
  if (!tempUrl.includes("http://", 0) && !tempUrl.includes("https://")) {
    tempUrl = `http://${tempUrl}`;
  }
  request(tempUrl, (error, response, body) => {
    if (urlDatabase[user] === undefined) {
      urlDatabase[user] = {};
    }
    if (!error) {
      urlDatabase[user][urlDataBaseKey] = {
        longUrl: tempUrl,
        user: user,
        creationTime: new Date(),
        visits: 0
      };
    }
    res.redirect(redirectUrl);
  });
};

// check users password to the stored user object
function getUserPass(emailTest, passTest){
  for(var item in users){
    if(users[item].email === emailTest && bcrypt.compare(passTest, users[item].password)){
      return users[item].id;
    }
  }
  return false;
}

// gives back a list of tinyURLs for that user
function getUsersTinyUrls(user_id){
  let userUrlList = {};
  for(let item in urlDB){
    if(user_id === urlDB[item].userid){
      userUrlList[item] = {
        id: item,
        url: urlDB[item].url,
        userid: user_id};
    }
  }
  return userUrlList;
}


// Returns a random string of length given in the argument from a selection of chars.
function generateRandomString(length) {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  var result = '';
  for (var i = length; i > 0; --i) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}


//------------------------ GETS ------------------------------
// go to urls/index when root url is entererd and logged in.
app.get("/", (req, res) => {
  console.log("--> inside get(/)");
  // checkIfLoggedIn(req, res, "/");
  if (req.session.userID === undefined) {
    res.render("login/login", {
      userID: undefined
    });
  }
  let templateVars = {
    userID: req.session.userID,
    urls: urlDatabase[req.session.userID]
  };
  res.render("/urls", templateVars);
});

// go to urls/index when /urls is entererd and logged in.
app.get("/urls", (req, res) => {
  console.log("--> inside get(/urls)");
  checkIfLoggedIn(req, res, "/urls");
  console.log(urlDatabase);

  let templateVars = {
    urls: urlDatabase,
    userID: req.session.userID
  };
  console.log(templateVars
  );
  res.status(200);
  res.render("urls/index", templateVars);
});

// go to urls/new when urls/new is entererd and logged in and url list exists.
app.get("/urls/new", (req, res) => {
  console.log("--> inside get(/urls/new)");
  checkIfLoggedIn(req, res, "/urls/new");


  let templateVars = {
    urls: urlDatabase[req.session.userID],
    userID: req.session.userID
  };
  console.log(urlDatabase);
  res.status(200);
  res.render("urls/new", templateVars);
});

// checkIfLoggedIn will return the 401
// 403 is the else of the 200 statuscode
// checkForUrlData will return the 404
// go to urls/show when valid short url is entered and logged in and url list exists.
// cant use "urls/:id" otherwise will show link twice used "urls/show"
app.get("/urls/:id", (req, res) => {
  console.log("--> inside get(/urls/:id)");
  checkIfLoggedIn(req, res);
  checkForUrlData(req, res);
  if (urlDatabase[req.session.userID][req.params.id] !== undefined) {
    let templateVars = {
      shortURL: req.params.id,
      userID: req.session.userID,
      longURL: urlDatabase[req.session.userID][req.params.id].longUrl
    };
    res.status(200);
    res.render("urls/show", templateVars);
  } else {
    let templateVars = {
      userID: req.session.userID,
      urls: urlDatabase[req.session.userID]
    };
    res.status(403);
    res.render("urls/index", templateVars);
  }
});

// go to link when valid short url is entered not need to be login
app.get("/u/:shortURL", (req, res) => {
  console.log("testing shorturl ", req.params.shortURL);
  if (req.params.shortURL !== null) {
    let shortURL = req.params.shortURL;
    let longURL = urlDatabase[shortURL].url;
    res.redirect(longURL);
  } else {
    res.redirect("/login");
  }
});

// console.log("--> inside get(/u/:shortURL)");
// checkIfLoggedIn(req, res);
// checkForUrlData(req, res);
// total view count


// if (urlDatabase[req.session.userID][req.params.shortURL]) {
//   urlDatabase[req.session.userID][req.params.shortURL].views += 1;
//       // urlDatabase[req.session.userID][req.params.shortURL].views += 1;
//   // unique view count in cookie
//   if (!req.cookies[req.session.userID][req.params.shortURL]) {
//     res.cookie([req.params.shortURL], 1)
//     urlDatabase[req.session.userID][req.params.shortURL].uniqueViews++
//   }

// res.redirect(longURL);
// } else {
//   let templateVars = {
//     userID: req.session.userID,
//     urls: urlDatabase[req.session.userID]
//   };
// res.statusCode = 404;
// res.render("urls/index", templateVars);
// }
// });

// go to register page.
app.get("/register", (req, res) => {

  if (req.session.userID !== undefined) {
    let templateVars = {
      userID: req.session.userID,
      urls: urlDatabase[req.session.userID]
    };
    res.render("urls", templateVars);
  } else {
    res.statusCode = 200;
    res.render("login/register", {
      userID: req.session.userID
    });
  }

});

// go to login page.
app.get("/login", (req, res) => {
  if (req.session.userID !== undefined) {
    let templateVars = {
      userID: req.session.userID,
      urls: urlDatabase[req.session.userID]
    };
    res.status(200);
    res.render("urls", templateVars);
  } else {
    res.render("login/login", {
      userID: req.session.userID
    });
  }
  res.statusCode = 200;
});

// go to the home page.
app.get("/home", (req, res) => {
  res.statusCode = 200;
  res.render("home/index", {
    userID: req.session.userID
  });
});

// go to home page for all other misc urls
app.get("*", (req, res) => {
  res.statusCode = 404;
  res.render("home/index", {
    userID: req.session.userID
  });
});


// ------------------------ POSTS ------------------------------
// post a new url for the user.
app.post("/urls", (req, res) => {
  console.log("--> inside post(/urls)");
  let rndmStr = generateRandomString(6);
  let tempUrl = req.body.longURL;
  checkNewUrlAndAdd(tempUrl, req.session.userID, rndmStr, "/urls", res);
});

// delete a specific url by the user.
app.post("/urls/*/delete", (req, res) => {
  console.log("--> inside post(/urls/*/delete)");
  delete urlDatabase[req.session.userID][req.params['0']];
  res.redirect("/urls");
});

// edit a specific url by the user.
app.post("/urls/*/edit", (req, res) => {
  console.log("--> inside post(/urls/*/edit");
  checkNewUrlAndAdd(req.body.longURL, req.session.userID, req.params['0'], "/urls", res);
});

// login the user
app.post("/login", (req, res) => {
  console.log("--> inside post(/login)");
  let statusCode = 401;
  if (users[req.body.email]) {
    bcrypt.compare(req.body.password, users[req.body.email].password, function (err, response) {
      if (!err && response) {
        req.session.userID = req.body.email;
        res.redirect("/");
      } else {
        res.statusCode = 401;
        res.send("invalid login credentials");
      }

    });
  } else {
    res.statusCode = 401;
    res.send("invalid login credentials");
  }
});

// register new user.
app.post("/register", (req, res) => {
  console.log("--> inside post(/register)");
  // With session cookies, there is no need to encrypt the user ID.
  let userID = req.body.email;

  res.statusCode = (userID === '' || req.body.password === '' || users[userID]) ? 400 : res.statusCode;

  if (res.statusCode['toString']()[0] === '4') {
    res.send("user name / password not accepted!");
  } else {
    bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
      if (err) {
        res.send("user name / password not accepted!");
      } else {
        users[userID] = {
          id: userID,
          email: req.body.email,
          password: hash
        };
        res.redirect("/");
      }
    });
  }
});

// logout current user.
app.post("/", (req, res) => {
  console.log("--> inside post(/)");
  req.session.userID = undefined;
  res.redirect('/');
});