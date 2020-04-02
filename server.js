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
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.engine('html', mustache());
app.set('view engine', 'html');
app.set('views', './views');

/**** Liens des images ****/
var ressources = app.use(express.static(__dirname + '/res'));
/**** Lien du css ****/
var css = app.use(express.static(__dirname + '/css'));

/**** Routes pour voir les pages du site ****/

/* Retourne sur la page d'Acceuil */
app.get('/', is_authenticated, (req, res) => {
  if(res.locals.authenticated) { res.redirect('/dashboard'); }
  else { res.render('index'); }
});

/* About page */
app.get('/about', (req, res) => {
  res.render('about');
});

/* page de connection */
app.get('/sign-in', is_authenticated, (req, res) => {
  if(res.locals.authenticated) { res.redirect('/dashboard'); }
  else { res.render('sign-in'); }
});

app.post('/sign-in', (req, res) => {
  var id = model.login(req.body.email, req.body.password);
  if (id == -1) { res.redirect('/sign-in'); }
  req.session.user = id;
  res.redirect('/dashboard');
});

/* page d'inscription */
app.get('/sign-up', is_authenticated, (req, res) => {
  if(res.locals.authenticated) { res.redirect('/dashboard'); }
  else { res.render('sign-up'); }
});

app.post('/sign-up', (req, res) => {
  var id = model.new_user(req.body.name, req.body.email, req.body.password);
  if (id == -1) { res.redirect('/sign-up'); }
  req.session.user = id;
  res.redirect('/dashboard');
});

/* dashboard */
app.get('/dashboard', is_authenticated, (req, res) => {
  if(res.locals.authenticated) { 
    var messagesList = model.getMessages();
    var user = model.fetchUserInformations(req.session.user);
    res.render('dashboard', {id: req.session.user, messages: messagesList, name: user.name, lvl: user.lvl, fanlvl: user.lvl, hr: user.heartReceived, bhr: user.brokenHeartReceived, hg: user.heartGiven, bhg: user.brokenHeartGiven}); 
  }
  else { res.redirect('/'); }
});

/* Envoi de message */
app.post('/send-message', (req, res) => {
  if (id == -1) { res.redirect('/sign-up'); }
  var id = model.new_message(req.session.user, req.body.message_content, req.body.message_category.toLowerCase());
  res.redirect('/dashboard');
});

/* Page de message */
app.get('/message/:id', is_authenticated, (req, res) => {
  //ENCORE LE PROBLEME QUI DECIDE DE AUSSI FAIRE LA REQUETE SUR LES CSS MAIS JE NE SAIS PAS POURQUOI IL FAIT CA UNIQUEMENT ICI
  if(res.locals.authenticated && model.getMessage(req.params.id) != -1 && req.params.id != "animations.css"  && req.params.id != "stylesheet.css"  && req.params.id != "colors.css") { 
    var message = model.getMessage(req.params.id);
    var user = model.fetchUserInformations(req.session.user);
    res.render('message', {id: req.session.user, messageInfo: message, name: user.name, lvl: user.lvl, fanlvl: user.lvl, hr: user.heartReceived, bhr: user.brokenHeartReceived, hg: user.heartGiven, bhg: user.brokenHeartGiven}); 
  }
  else { res.redirect('/'); }
});

/* Gestion de coeurs */

/* déconnexion */
app.get('/logout', is_authenticated_force, (req, res) => {
  req.session.user = null;
  res.redirect('/'); 
});

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

