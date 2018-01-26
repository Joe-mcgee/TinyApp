var express = require("express");
const cookieSession = require('cookie-session')
var app = express();
var PORT = process.env.PORT || 8080;
const bcrypt = require('bcrypt');

app.set("view engine", "ejs");
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));

var urlDatabase = {
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


app.get('/register', (req, res) => {

  let templateVars = {
    currentUrl: 'register',
    status: 'logged out',
    user: req.session.user_id
  };

  if(typeof templateVars['user'] === 'undefined') {
    res.render('register', templateVars);
    return
  } else {
    res.redirect('urls')
  }


});

app.post('/register', (req, res) => {


  let randomId = generateRandomString();
  let email = req.body.email;
  let password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10)
  let passed = false;
  if (email === '' || password === '') {
    res.redirect('register')
    return;
  } else {
    for (id in users) {
      if (users[id]['email'] === email) {
        res.redirect('register')
        return
      }
    }
  }
  passed = true
  if (passed = true) {
    req.session.user_id = randomId;
    users[randomId] = { id: req.session.user_id, email: req.body.email, password: hashedPassword };
    urlDatabase[randomId] = {};
    res.redirect('urls');
  }

});


app.get('/login', (req, res) => {
  let templateVars = {
    status: 'logged out',
    currentUrl: '/login'
  }
  res.render('login', templateVars);
});

app.post('/login', (req, res) => {
  let email = req.body.email;
  let password = req.body.password;
  let passed = false;
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

  if (passed === false) {
    res.redirect('login');
    return
  } else {
    res.redirect('/urls');
  }
});

app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/');
});

app.get("/", (req, res) => {
  let templateVars = {
    user: req.session["user_id"],
    urlDatabase: urlDatabase
  };
  res.render('home', templateVars);
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
    currentUrl: 'urls/new',

  };
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
  let user = req.session['user_id'];
  let urls = getUrls(user);
  let templateVars = { urls: urls, 'user': req.session['user_id'], currentUrl: 'urls', status: 'logged in' };
  res.render("urls_index", templateVars);
});

app.get("/urls/:id", (req, res) => {

  try {
  let templateVars = {
    shortURL: req.params.id,
    longURL: urlDatabase[req.session['user_id']][req.params.id],
    user: req.session['user_id'],
    status: 'logged in',
    currentUrl: '/url/:id'
  };
} catch (e) {
  res.redirect('/login')
  return
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
  let templateVars = {
    user: req.session['user_id'],
    status: 'logged in',
    currentUrl: '/urls/:id'
  }


  urlDatabase[templateVars['user']][req.params.id] = req.body.newurl
  res.redirect('/urls');

});

app.post("/urls/:id/delete", (req, res) => {
  let templateVars = { user: req.session['user_id'], shortURL: req.params.id };
  let pass = false;
  for (id in urlDatabase) {
    for (list in urlDatabase[id]) {

      if (templateVars['shortURL'] === list) {

        if (id === templateVars['user']) {
          pass = true;
          delete urlDatabase[id][templateVars['shortURL']]
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
  let templateVars = {
    user: req.session["user_id"]
  };
  let random = generateRandomString();
  let input = req.body['longURL'];
  let httpRegex = RegExp('^http://');

  if (httpRegex.test(input)) {
    urlDatabase[templateVars['user']][random] = input;
  } else {
    urlDatabase[random] = 'http://' + input;
  }
  res.redirect(`urls/${random}`);
});

app.get("/u/:shortURL", (req, res) => {
  let templateVars = {
    user: req.session["user_id"],
    status: 'global',
    currentUrl: '/u/:shortURL'
  };

  for (id in urlDatabase) {
    for (list in urlDatabase[id]) {
      if (list === req.params.shortURL) {
        res.redirect(urlDatabase[id][list])
        return
      }
    }
  }
  res.sendStatus(404)
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
