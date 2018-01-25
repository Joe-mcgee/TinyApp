
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

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
}


function generateRandomString() {
  // https://stackoverflow.com/questions/10726909/random-alpha-numeric-string-in-javascript
  return Math.random().toString(36).slice(7);
}


app.get('/register', (req, res) => {

  res.render('register');
});

app.post('/register', (req, res) => {
  console.log(users)
  let randomId = generateRandomString();
  let email = req.body.email;
  let password = req.body.password;
  let passed = true;
  if (email !== '' || password !== '') {
    for (id in users) {
      if (users[id]['email'] === email) {
        passed = false;
      }
    }
  }

  if (passed === true) {

    users[randomId] = { id: randomId, email: req.body.email, password: req.body.password };
    res.cookie('user', randomId);

    res.redirect('urls');

  } else {
    res.status(400);
    res.redirect('register')
  }
});


app.get('/login', (req, res) => {
  let templateVars = {user: req.cookies['user']}
res.render('login', templateVars)
})

app.post('/login', (req, res) => {
  res.cookie('user', req.body.user);
  res.redirect('/urls');
});

app.post('/logout', (req, res) => {
  res.clearCookie('user')
  res.redirect('/login')
})

app.get("/", (req, res) => {
  let templateVars = {
  user: req.cookies["user"],
};
  res.end("Hello!", templateVars);
});

app.get("/urls.json", (req, res) => {
  let templateVars = {
  user: req.cookies["user"]
};
  res.json(urlDatabase);
});

app.get("/urls/new", (req, res) => {
  let templateVars = {
  user: req.cookies["user"]

};
  res.render("urls_new", templateVars);
});


app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase,  user: req.cookies['user'] };
  res.render("urls_index", templateVars);
});

app.get("/urls/:id", (req, res) => {

  let templateVars = { shortURL: req.params.id, longURL: urlDatabase[req.params.id], user: req.cookies['user'] };
  res.render("urls_show", templateVars);
});

app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body.newurl;
  res.redirect('/urls')

});

app.post("/urls/:id/delete", (req, res) => {

  delete urlDatabase[req.params.id];
  res.redirect('/urls');
});



app.post("/urls", (req, res) => {
  let templateVars = {
  user: req.cookies["user"]
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
  user: req.cookies["user"]
};
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL, templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
