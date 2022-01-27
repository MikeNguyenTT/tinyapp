const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require('bcryptjs');
const cookieSession = require('cookie-session');
const { getUserByEmail, generateRandomString, urlsForUser } = require('./helpers.js');

const app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ["da097fa0-b5ef-4506-b8c3-28166cb4c4e8", "f0553cf8-a720-45d0-abba-e25dbc47eee6"]
}));
app.set("view engine", "ejs");

// middleware function
const currentUser = (req, res, next) => {
  if (req.session["user_id"]) {
    req.currentUser = req.session["user_id"];
  }
  next();
};
app.use(currentUser);

const PORT = 8080;
const SALT = bcrypt.genSaltSync(10);

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW"
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW"
  }
};

const users = {};

app.get("/", (req, res) => {
  if (!req.currentUser) {
    res.redirect("/login");
  }
  res.redirect("/urls");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

//show all available shorten url in database
app.get("/urls", (req, res) => {
  if (!req.currentUser) {
    return renderErrorPage(req, res, 403, "Please Login");
  }
  const templateVars = {
    urls: urlsForUser(req.currentUser, urlDatabase),
    user: users[req.currentUser]
  };
  res.render("urls_index", templateVars);
});

// enter registration page
app.get("/register", (req, res) => {
  if (req.currentUser) {
    return res.redirect("/urls");
  }
  const templateVars = {
    user: users[req.currentUser]
  };
  res.render("urls_register", templateVars);
});

// enter login page
app.get("/login", (req, res) => {
  if (req.currentUser) {
    return res.redirect("/urls");
  }
  const templateVars = {
    user: users[req.currentUser]
  };
  res.render("urls_login", templateVars);
});

// enter create new url page
app.get("/urls/new", (req, res) => {
  if (!req.currentUser) {
    return res.redirect("/login");
  }
  const templateVars = { user: users[req.currentUser] };
  res.render("urls_new", templateVars);
});

// open detail of a short url to show long url
app.get("/urls/:shortURL", (req, res) => {
  
  if (urlDatabase[req.params.shortURL].userID !== req.currentUser) {
    return renderErrorPage(req, res, 403, "No permission to access this URL");
  }

  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    user: users[req.currentUser]
  };
  res.render("urls_show", templateVars);
});

// redirect to long url based on a given short url
app.get("/u/:shortURL", (req, res) => {
  
  if (urlDatabase[req.params.shortURL]) {
    const longURL = urlDatabase[req.params.shortURL].longURL;
    res.redirect(longURL);
  } else {
    return renderErrorPage(req, res, 404, "Short URL Not Found");
  }
});

//create new shorten url
app.post("/urls", (req, res) => {
  if (!req.currentUser) {
    return renderErrorPage(req, res, 404, "Please login");
  }
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    longURL: req.body.longURL,
    userID: req.currentUser
  };
  res.redirect(`/urls/${shortURL}`);
});

//login
app.post("/login", (req, res) => {
  const email = req.body.email;
  const plainPassword = req.body.password;
  
  if (!email || !plainPassword) {
    return renderErrorPage(req, res, 400, "Please input both email and password");
  }
  
  const user = getUserByEmail(email, users);
  if (!user) {
    return renderErrorPage(req, res, 403, "This email is not registered yet");
  }

  if (!bcrypt.compareSync(plainPassword, user.hashedPassword)) {
    return renderErrorPage(req, res, 403, "Incorrect password");
  }
  
  req.session["user_id"] = user.id;
  res.redirect("/urls");
});

//logout
app.post("/logout", (req, res) => {
  req.session["user_id"] = null;
  res.redirect("/login");
});

//register
app.post("/register", (req, res) => {
  const email = req.body.email;
  const plainPassword = req.body.password;
  
  if (!email || !plainPassword) {
    return renderErrorPage(req, res, 403, "Please input both email and password");
  }
  
  if (getUserByEmail(email, users)) {
    return renderErrorPage(req, res, 403, "This email is already registered");
  }

  const hashedPassword = bcrypt.hashSync(plainPassword, SALT);
  const id = generateRandomString();
  users[id] = {id, email, hashedPassword};
  req.session["user_id"] = id;
  res.redirect("/urls");
});

//delete
app.post("/urls/:shortURL/delete", (req, res) => {
  if (!urlDatabase[req.params.shortURL]) {
    return renderErrorPage(req, res, 404, "This URL to be deleted is not found");
  }
  if (urlDatabase[req.params.shortURL].userID !== req.currentUser) {
    return renderErrorPage(req, res, 403, "No permission to delete this URL");
  }
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

// update
app.post("/urls/:id", (req, res) => {
  if (!urlDatabase[req.params.id]) {
    return renderErrorPage(req, res, 404, "This URL to be updated is not found");
  }
  if (urlDatabase[req.params.id].userID !== req.currentUser) {
    return renderErrorPage(req, res, 403, "No permission to update this URL");
  }
  urlDatabase[req.params.id].longURL = req.body.updatedLongURL;
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

const renderErrorPage = (req, res, statusCode, errorMessage) => {
  const templateVars = {
    errorMessage: `${statusCode} - ${errorMessage}`,
    urls: urlDatabase,
    user: users[req.currentUser]
  };
  return res.status(statusCode).render("urls_error", templateVars);
};