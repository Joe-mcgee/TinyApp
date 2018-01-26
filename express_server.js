const express = require("express");
const cookieSession = require('cookie-session');
const bodyParser = require("body-parser");
const bcrypt = require('bcrypt');

const app = express();
const PORT = process.env.PORT || 8080;

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));

// DB
const urlDatabase = {
  'userRandomID': {
    "b2xVn2": "http://www.lighthouselabs.ca",
    "c3vVn3": 'http://www.apple.com'
  },
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
};

//HelperFn's
function getUrls(user) {
  let output;
  for (id in urlDatabase) {
    if (user === id) {
      output = (urlDatabase[id]);
    }
  }
  return output;
}

function generateRandomString() {
  // https://stackoverflow.com/questions/10726909/random-alpha-numeric-string-in-javascript
  return Math.random().toString(36).slice(7);
}

//Routes
app.get("/", (req, res) => {
  let templateVars = {
    user: req.session["user_id"],
    urlDatabase: urlDatabase
  };
  res.render('home', templateVars);
});

app.get('/register', (req, res) => {

  let templateVars = {
    currentUrl: 'register',
    status: 'logged out',
    user: req.session.user_id
  };

  if (typeof templateVars['user'] === 'undefined') {
    res.render('register', templateVars);
    return;
  } else {
    res.redirect('urls');
  }

});

app.post('/register', (req, res) => {
  let randomId = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);
  let passed = false;
  // handles improper input
  if (email === '' || password === '') {
    res.redirect('register');
    return;
  } else {
    for (id in users) {
      if (users[id]['email'] === email) {
        res.redirect('register');
        return;
      }
    }
  }
  passed = true;
  //if input is good =>
  if (passed === true) {
    req.session.user_id = randomId;
    users[randomId] = { id: req.session.user_id, email: req.body.email, password: hashedPassword };
    urlDatabase[randomId] = {};
    res.redirect('urls');
  }
});

app.get('/login', (req, res) => {
  const templateVars = {
    status: 'logged out',
    currentUrl: '/login'
  };
  res.render('login', templateVars);
});

app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  let passed = false;
  // conditions for correct login
  if (email !== '' || password !== '') {
    for (list in users) {
      if (users[list]['email'] === email) {
        if (bcrypt.compareSync(password, users[id]['password'])) {
          passed = true;
          req.session.user_id = users[list];
        }

      }
    }
  }
  // if login fails
  if (passed === false) {
    res.redirect('login');
    return;
  } else {
    res.redirect('/urls');
  }
});

app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/');
});

app.get("/urls.json", (req, res) => {
  let templateVars = {
    user: req.session["user_id"]
  };
  res.json(urlDatabase);
});

app.get("/urls/new", (req, res) => {
  let templateVars = {
    user: req.session["user_id"],
    status: 'logged in',
    currentUrl: 'urls/new'
  };
  //protect against unauthorized access
  if (typeof templateVars['user'] === 'undefined') {
    res.redirect('/login');
  } else {
    res.render("urls_new", templateVars);
  }
});

app.get("/urls", (req, res) => {
  const user = req.session['user_id'];
  if (typeof user === 'undefined') {
    res.redirect('/');
    return;
  }
  let urls = getUrls(user);
  const templateVars = { urls: urls, 'user': req.session['user_id'], currentUrl: 'urls', status: 'logged in' };
  res.render("urls_index", templateVars);
});

app.get("/urls/:id", (req, res) => {

  let templateVars = {
    shortURL: req.params.id,
    user: req.session['user_id'],
    status: 'logged in',
    currentUrl: '/url/:id'
  };
  // protect against access without session cookie
  try {
    templateVars['longURL'] = urlDatabase[req.session['user_id']][req.params.id];
  } catch (e) {
    res.redirect('/login');
    return;
  }
  let pass = false;
  for (id in urlDatabase) {
    let targetId = id;
    for (list in urlDatabase[id]) {
      if (templateVars['shortURL'] === list) {
        if (targetId === templateVars['user']) {
          pass = true;
          res.render("urls_show", templateVars);
        }
      }
    }
  }
  if (!pass) {
    res.sendStatus(403);
  }
});

app.post("/urls/:id", (req, res) => {
  const templateVars = {
    user: req.session['user_id'],
    status: 'logged in',
    currentUrl: '/urls/:id'
  };
  urlDatabase[templateVars['user']][req.params.id] = req.body.newurl;
  res.redirect('/urls');
});

app.post("/urls/:id/delete", (req, res) => {
  const templateVars = { user: req.session['user_id'], shortURL: req.params.id };
  //protect against delete from unauthorized user
  let pass = false;
  for (id in urlDatabase) {
    for (list in urlDatabase[id]) {
      if (templateVars['shortURL'] === list) {
        if (id === templateVars['user']) {
          pass = true;
          delete urlDatabase[id][templateVars['shortURL']];
          res.redirect('/urls');
          return;
        }
      }
    }
  }
  if (!pass) {
    res.redirect('/urls');
  }
});

app.post("/urls", (req, res) => {
  const templateVars = {
    user: req.session["user_id"]
  };
  let random = generateRandomString();
  const input = req.body['longURL'];
  const httpRegex = RegExp('^http://');
  //adds http:// if not added to url
  if (httpRegex.test(input)) {
    urlDatabase[templateVars['user']][random] = input;
  } else {
    urlDatabase[random] = 'http://' + input;
  }
  res.redirect(`urls/${random}`);
});

app.get("/u/:shortURL", (req, res) => {
  const templateVars = {
    user: req.session["user_id"],
    status: 'global',
    currentUrl: '/u/:shortURL'
  };

  //allows for redirects from all
  for (id in urlDatabase) {
    for (list in urlDatabase[id]) {
      if (list === req.params.shortURL) {
        res.redirect(urlDatabase[id][list]);
        return;
      }
    }
  }
  res.sendStatus(404);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
