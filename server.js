"use strict"
/* Serveur pour le site de recettes */
var express = require('express');
var mustache = require('mustache-express');
const cookieSession = require('cookie-session');

var model = require('./model');
var app = express();

//Cookie Session
app.use(cookieSession({
  secret: 'mot-de-passe-du-cookie',
}));

// parse form arguments in POST requests
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));

app.engine('html', mustache());
app.set('view engine', 'html');
app.set('views', './views');

/**** Liens des images ****/
var ressources = app.use(express.static(__dirname + '/res'));

/**** Routes pour voir les pages du site ****/

/* Retourne sur la page d'Acceuil */
app.get('/', (req, res) => {
  res.render('index');
});

/* About page */
app.get('/about', (req, res) => {
  res.render('about');
});

/* page de connection */
app.get('/sign-in', (req, res) => {
  res.render('sign-in');
});

app.post('/sign-in', (req, res) => {
  var id = model.login(req.body.name, req.body.password);
  if (id == -1) { res.redirect('/sign-in'); }
  req.session.user = id;
  res.redirect('/dashboard');
});

/* page d'inscription */
app.get('/sign-up', (req, res) => {
  res.render('sign-up');
});

app.post('/sign-up', (req, res) => {
  var id = model.new_user(req.body.name, req.body.password);
  if (id == -1) { res.redirect('new_user'); }
  req.session.user = id;
  res.redirect('/');
})

app.listen(3000, () => console.log('listening on http://localhost:3000'));

/* MIDDLEWARES */
/* Gestion de la session */
function is_authenticated(req, res, next) {
  if (req.session.user != null) { res.locals.authenticated = true; }
  else { res.locals.authenticated = false; }
  next();
}

function is_authenticated_force(req, res, next) {
  if (req.session.user == null) { res.status(401).send("authentication Required"); }
  else { next(); }
};

