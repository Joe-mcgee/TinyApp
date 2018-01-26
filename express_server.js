const express = require("express");
const cookieSession = require('cookie-session');
const bodyParser = require("body-parser");
const bcrypt = require('bcrypt');
const methodOverride = require('method-override');
const app = express();
const PORT = process.env.PORT || 8080;

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));
app.use(methodOverride('_method'));

// DB
const urlDatabase = {
  'userRandomID': {
    "b2xVn2": {
      longURL: "http://www.lighthouselabs.ca",
      visits: 0
    },
    "c3vVn3": {
      longURL: 'http://www.apple.com',
      visits: 0
    }
  },
  'user2RandomID': {
    "9sm5xK": {
      longURL: "http://www.google.com",
      visits: 0
    }
  }
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
  let output = {};

  for (shortUrl in urlDatabase[user]) {
    output[shortUrl] = urlDatabase[user][shortUrl]['longURL'];

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
    templateVars['longURL'] = urlDatabase[req.session['user_id']][templateVars['shortURL']]['longURL'];
  } catch (e) {
    res.redirect('/login');
    return;
  }
  let pass = false;
  for (userid in urlDatabase) {
    let targetId = userid;

    for (shortUrl in urlDatabase[userid]) {
      if (templateVars['shortURL'] === shortUrl) {

        if (userid === templateVars['user']) {
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

app.put("/urls/:id", (req, res) => {
  const templateVars = {
    user: req.session['user_id'],
    status: 'logged in',
    currentUrl: '/urls/:id'
  };
  urlDatabase[templateVars['user']][req.params.id]['longURL'] = req.body.newurl;
  res.redirect('/urls');
});

app.delete("/urls/:id/delete", (req, res) => {
  const templateVars = { user: req.session['user_id'], shortURL: req.params.id };
  //protect against delete from unauthorized user
  let pass = false;
  for (userid in urlDatabase) {
    for (shortUrl in urlDatabase[userid]) {
      if (templateVars['shortURL'] === shortUrl) {
        if (userid === templateVars['user']) {
          pass = true;
          delete urlDatabase[userid][templateVars['shortURL']];
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
    urlDatabase[templateVars['user']][random] = {'longURL' : input,
                                                  'visits': 0}
  } else {
    urlDatabase[templateVars['user']][random] = {'longURL' : 'http://' + input,
                                                  'visits': 0};
  }
  res.redirect(`urls/`);
});

app.get("/u/:shortURL", (req, res) => {
  const templateVars = {
    user: req.session["user_id"],
    status: 'global',
    currentUrl: '/u/:shortURL'
  };

  //allows for redirects from all
  for (userid in urlDatabase) {
    for (shortUrl in urlDatabase[userid]) {
      if (shortUrl === req.params.shortURL) {
        res.redirect(urlDatabase[userid][shortURL]['longURL']);
        return;
      }
    }
  }
  res.sendStatus(404);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
