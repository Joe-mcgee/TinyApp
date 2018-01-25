
var express = require("express");
var cookieParser = require('cookie-parser');
var app = express();
var PORT = process.env.PORT || 8080;
app.set("view engine", "ejs");


const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser())

var urlDatabase = {
  'userRandomID': { "b2xVn2": "http://www.lighthouselabs.ca",
                    "c3vVn3": 'http://www.apple.com' },
  'user2RandomID': { "9sm5xK": "http://www.google.com" }
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

function getUrls(user) {
  let output;
  for (id in urlDatabase) {
    if (user['id'] === id) {
      output = (urlDatabase[id]);
    }
  }
  return output;
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
    res.sendStatus(400);
    res.redirect('register')
  }
});


app.get('/login', (req, res) => {
res.render('login');
});

app.post('/login', (req, res) => {
  let email = req.body.email;
  let password = req.body.password;
  let passed = false;
  if (email !== '' || password !== '') {
    for (id in users) {
      if (users[id]['email'] === email) {
        if(users[id]['password'] === password) {
          passed = true;
          res.cookie('user', users[id]);
        }

      }
    }
  }

  if (passed === false) {
    res.sendStatus(403)

  } else {
   res.redirect('/');
  }
});

app.post('/logout', (req, res) => {
  res.clearCookie('user');
  res.redirect('/login');
});

app.get("/", (req, res) => {
  let templateVars = {
  user: req.cookies["user"]
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
  console.log(templateVars['user'])
  if (typeof templateVars['user'] === 'undefined') {
    res.redirect('/login');
     } else {
    res.render("urls_new", templateVars);
  }
});


app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  let user = req.cookies['user']
  let urls = getUrls(user)
  let templateVars = { urls: urls,  'user': req.cookies['user'] };
  res.render("urls_index", templateVars);
});

app.get("/urls/:id", (req, res) => {

  let templateVars = { shortURL: req.params.id, longURL: urlDatabase[req.params.id], user: req.cookies['user'] };
  res.render("urls_show", templateVars);
});

app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body.newurl;
  res.redirect('/urls');

});

app.post("/urls/:id/delete", (req, res) => {

  delete urlDatabase[req.params.id];
  res.redirect('/urls');
});



app.post("/urls", (req, res) => {
  let templateVars = {
  user: req.cookies["user"]
};
  console.log(templateVars['user'])
  let random = generateRandomString();
  let input = req.body['longURL'];
  let httpRegex = RegExp('^http://');
  console.log(urlDatabase[templateVars['user']])
  if (httpRegex.test(input)) {
    urlDatabase[templateVars['user']][random] = input;
  } else {
    urlDatabase[random] = 'http://' + input;
  }
  res.redirect(`urls/${random}`);
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
