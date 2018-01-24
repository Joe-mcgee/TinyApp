
var express = require("express");
var cookieParser = require('cookie-parser');
var app = express();
var PORT = process.env.PORT || 8080;
app.set("view engine", "ejs");


const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser())

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};


function generateRandomString() {
  // https://stackoverflow.com/questions/10726909/random-alpha-numeric-string-in-javascript
  return Math.random().toString(36).slice(7);
}

function getCookie(cookie) {

}

app.post('/login', (req, res) => {
  res.cookie('username', req.body.username);
  res.redirect('/urls');
});

app.post('/logout', (req, res) => {
  res.clearCookie('username')
  res.redirect('/urls')
})

app.get("/", (req, res) => {
  let templateVars = {
  username: req.cookies["username"],
};
  res.end("Hello!", templateVars);
});

app.get("/urls.json", (req, res) => {
  let templateVars = {
  username: req.cookies["username"]
};
  res.json(urlDatabase);
});

app.get("/urls/new", (req, res) => {
  let templateVars = {
  username: req.cookies["username"]

};
  res.render("urls_new", templateVars);
});


app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase,  username: req.cookies['username'] };
  res.render("urls_index", templateVars);
});

app.get("/urls/:id", (req, res) => {

  let templateVars = { shortURL: req.params.id, longURL: urlDatabase[req.params.id], username: req.cookies['username'] };
  res.render("urls_show", templateVars);
});

app.post("/urls/:id", (req, res) => {
  let templateVars = {
  username: req.cookies["username"]
};
  urlDatabase[req.params.id] = req.body.newurl;
  res.redirect('/urls', templateVars)

});

app.post("/urls/:id/delete", (req, res) => {
  let templateVars = {
  username: req.cookies["username"]
};
  delete urlDatabase[req.params.id];
  res.redirect('/urls', templateVars);
});



app.post("/urls", (req, res) => {
  let templateVars = {
  username: req.cookies["username"]
};
  let random = generateRandomString();
  let input = req.body['longURL'];
  let httpRegex = RegExp('^http://');
  if (httpRegex.test(input)) {
    urlDatabase[random] = req.body['longURL'];
  } else {
    urlDatabase[random] = 'http://' + input;
  }
  res.redirect(`urls/${random}`, templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  let templateVars = {
  username: req.cookies["username"]
};
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL, templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
