"use strict"
/* Serveur pour le site de recettes */
var express = require('express');
var mustache = require('mustache-express');
const cookieSession = require('cookie-session');

var model = require('./model');
var app = express();

//Cookie Session
app.use(cookieSession({
  secret: 'wo-ai-xiongmao',
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
  if(id == undefined) { res.render('sign-in', {error : 'user does not exist or password is incorrect'}); }
  else {
    req.session.user = id;
    res.redirect('/dashboard');
  }
});

/* page d'inscription */
app.get('/sign-up', is_authenticated, (req, res) => {
  if(res.locals.authenticated) { res.redirect('/dashboard'); }
  else { res.render('sign-up'); }
});

app.post('/sign-up', (req, res) => {
  if(req.body.password != req.body.passwordConfirm) { res.render('sign-up', {error : 'passwords does not match', name : req.body.name, email : req.body.email}); }
  else if (model.emailExist(req.body.email)) { res.render('sign-up', {error : 'email is already used', name : req.body.name, email : req.body.email}); }
  else {
    var id = model.new_user(req.body.name, req.body.email, req.body.password);
    req.session.user = id;
    res.redirect('/dashboard');
  }
});

/* dashboard */
app.get('/dashboard', is_authenticated, (req, res) => {
  if(res.locals.authenticated) { 
    var user = model.fetchUserInformations(req.session.user);
    var messagesList = model.addIsFromUser(model.getMessages(), req.session.user);
    messagesList = model.getHearts(messagesList, 0);
    res.render('dashboard', {id: req.session.user, messages: messagesList, userData: user}); 
  }
  else { res.redirect('/'); }
});

/* Page user */
app.get('/user/:id', is_authenticated, (req, res) => {
  if(res.locals.authenticated && model.fetchUserInformations(req.params.id) != undefined) {
    var viewUser = model.canUpdate(model.fetchUserInformations(req.params.id), req.session.user);
    if(viewUser == undefined) res.redirect('/');
    var user = model.fetchUserInformations(req.session.user);
    var messagesList = model.addIsFromUser(model.getMessagesFrom(req.params.id), req.session.user);
    messagesList = model.getHearts(messagesList, 0);
    res.render('user', {viewUser: viewUser, userData: user, messages: messagesList});
  }
  else { res.redirect('/'); }
});

app.get('/update/user/:id', is_authenticated, (req, res) => {
  var viewUser = model.canUpdate(model.fetchUserInformations(req.params.id), req.session.user);
  if(res.locals.authenticated && model.fetchUserInformations(req.params.id) != undefined && viewUser != undefined && viewUser.canUpdate) {
    var user = model.fetchUserInformations(req.session.user);
    var isAdmin = (model.isAdmin(req.session.user) && req.params.id != 0) || (model.isAdmin(req.session.user) && model.fetchUserCategory != 2) || req.params.id == 0;
    res.render('updateuser', {viewUser: viewUser, userData: user, isAdmin : isAdmin});
  }
  else { res.redirect('/'); }
});

app.post('/update/user/:id', is_authenticated, (req, res) => {
  var viewUser = model.canUpdate(model.fetchUserInformations(req.params.id), req.session.user);
  var isAdmin = (model.isAdmin(req.session.user) && req.params.id != 0) || (model.isAdmin(req.session.user) && model.fetchUserCategory != 2) || req.params.id == 0;
  if(res.locals.authenticated && model.fetchUserInformations(req.params.id) != undefined && viewUser.canUpdate) {
    var user = model.fetchUserInformations(req.session.user);
    if(model.comparePassword(req.body.passwordConfirm, model.fetchUserPassword(req.params.id).password) == false && !model.isAdmin(req.session.user)) { res.render('updateuser', {viewUser: viewUser, userData: user, isAdmin : isAdmin, error: 'password is incorrect'}); }
    else { 
      viewUser = model.canUpdate(model.fetchUserInformations(model.updateUser(viewUser.id, req.body.name, req.body.email, req.body.password, parseInt(req.body.userCategory)%3)), req.session.user);
      if(viewUser.id == req.session.user) { user = model.fetchUserInformations(req.session.user); }
      isAdmin = (model.isAdmin(req.session.user) && req.params.id != 0) || (model.isAdmin(req.session.user) && model.fetchUserCategory != 2) || req.params.id == 0;
      res.render('updateuser', {viewUser: viewUser, userData: user, isAdmin : isAdmin, confirm: 'updated successfully'});
    }
  }
  else { res.redirect('/'); }
});

/* Supression de l'utilisateur */
app.get('/delete/user/:id', is_authenticated, (req, res) => {
  var canUpdate = model.canUpdate(model.fetchUserInformations(req.params.id), req.session.user).canUpdate;
    if(res.locals.authenticated && model.getUser(req.params.id) != undefined && canUpdate && req.params.id != 0) {
        var user = model.fetchUserInformations(req.session.user);
        var viewUser = model.fetchUserInformations(req.params.id);
        res.render('deleteuser', {viewUser: viewUser, userData: user});
    }
     else { res.redirect('/'); }
});

app.post('/delete/user/:id', is_authenticated, (req, res) => {
    var canUpdate = model.canUpdate(model.fetchUserInformations(req.params.id), req.session.user).canUpdate;
    if(res.locals.authenticated && model.getUser(req.params.id) != undefined && canUpdate) {
        model.deleteUser(req.params.id);
        if(req.params.id == req.session.user) { req.session.user = null; }
    }
    res.redirect('/');
});

/* Envoi de message */
app.post('/send-message', (req, res) => {
  if (req.session.user == undefined) { res.redirect('/'); }
  var messageId = model.new_message(req.session.user, req.body.message_content, req.body.message_category.toLowerCase());
  res.redirect('/dashboard');
});

app.post('/send-comment/:id', (req, res) => {
  if (req.session.user == undefined) { res.redirect('/'); }
  var user = model.getUser(req.session.user);
  var comment = model.new_comment(req.session.user, req.params.id, req.body.comment_content);
  var message = model.getMessage(req.params.id);
  res.redirect('/message/'+req.params.id);
});

/* Page de message */
app.get('/message/:id', is_authenticated, (req, res) => {
  if(res.locals.authenticated && model.getMessage(req.params.id) != undefined) { 
    var message = model.addIsFromUser(model.getMessage(req.params.id), req.session.user);
    message = model.getHearts(message, 0);
    var comment = model.addIsFromUser(model.getComments(message.id), req.session.user);
    comment = model.getHearts(comment, 1);
    var user = model.fetchUserInformations(req.session.user);
    res.render('message', {messageData: message, commentData: comment, id: req.session.user, userData: user}); 
  }
  else { res.redirect('/'); }
});

/* Suppression de message */
app.get('/delete/message/:id', is_authenticated, (req, res) => {
  if(res.locals.authenticated && model.getMessage(req.params.id) != undefined) { 
    var message = model.addIsFromUser(model.getMessage(req.params.id), req.session.user);
    message = model.getHearts(message, 0);
    if (!message.isFromUser) res.redirect('/');
    var user = model.fetchUserInformations(req.session.user);
    res.render('deletemessage', {messageData: message, id: req.session.user, userData: user}); 
  }
  else { res.redirect('/'); }
});
app.post('/delete/message/:id', is_authenticated, (req, res) => {
  if(res.locals.authenticated && model.getMessage(req.params.id) != undefined) { 
    var message = model.addIsFromUser(model.getMessage(req.params.id), req.session.user);
    if (!message.isFromUser) res.redirect('/');
    model.deleteMessage(req.params.id);
  }
  res.redirect('/');
});

app.get('/delete/comment/:id', is_authenticated, (req, res) => {
  if(res.locals.authenticated && model.getComment(req.params.id) != undefined) { 
    var comment = model.addIsFromUser(model.getComment(req.params.id), req.session.user);
    comment = model.getHearts(comment, 1);
    if (!comment.isFromUser) res.redirect('/');
    var user = model.fetchUserInformations(req.session.user);
    res.render('deletecomment', {commentData: comment, id: req.session.user, userData: user}); 
  }
  else { res.redirect('/'); }
});
app.post('/delete/comment/:id', is_authenticated, (req, res) => {
  if(res.locals.authenticated && model.getComment(req.params.id) != undefined) { 
    var message = model.addIsFromUser(model.getComment(req.params.id), req.session.user);
    var messageId;
    if (!message.isFromUser) res.redirect('/');
    messageId = model.getComment(req.params.id).messageId;
    model.deleteComment(req.params.id);
  }
  res.redirect('/message/'+messageId);
});

/* Gestion de coeurs */
app.get('/addHeart/message/:id', is_authenticated, (req, res) => {
  if(res.locals.authenticated && model.getMessage(req.params.id) != undefined) { 
    model.addHeart(req.session.user, req.params.id, 0, 0);
    res.redirect('back');
  }
  else { res.redirect('/'); }
});
app.get('/addBrokenHeart/message/:id', is_authenticated, (req, res) => {
  if(res.locals.authenticated && model.getMessage(req.params.id) != undefined) { 
    model.addHeart(req.session.user, req.params.id, 1, 0);
    res.redirect('back');
  }
  else { res.redirect('/'); }
});

app.get('/addHeart/comment/:id', is_authenticated, (req, res) => {
  if(res.locals.authenticated && model.getComment(req.params.id) != undefined) { 
    model.addHeart(req.session.user, req.params.id, 0, 1);
    res.redirect('back');
  }
  else { res.redirect('/'); }
});
app.get('/addBrokenHeart/comment/:id', is_authenticated, (req, res) => {
  if(res.locals.authenticated && model.getComment(req.params.id) != undefined) { 
    model.addHeart(req.session.user, req.params.id, 1, 1);
    res.redirect('back');
  }
  else { res.redirect('/'); }
});

/* Leaderboards */
app.get('/leaderboards', (req, res) => {
  if (req.session.user == undefined) { res.redirect('/'); }
  var user = model.fetchUserInformations(req.session.user);
  var count = model.goCount();
  //var heartR = model.goLike();
  var heartG = model.goFan();
  var messages = model.goBest();
  //var comments = model.goMment();
  //var bheartR = model.notLike();
  var bheartG = model.notFan();
  var badmessages = model.notBest();
  res.render('leaderboards', {id: req.session.user, goCount: count, goFan: heartG, goBest: messages, notFan: bheartG, notBest: badmessages, userData: user}); 
});

/* Categorie */
app.get('/category/:cat', is_authenticated, (req, res) => {
  if(!res.locals.authenticated) { res.redirect('/'); }
  var user = model.fetchUserInformations(req.session.user);
  var messagesList = model.addIsFromUser(model.getMessagesCategory(req.params.cat), req.session.user);
  messagesList = model.getHearts(messagesList, 0);
  res.render('category', {id: req.session.user, messages: messagesList, userData: user, category: req.params.cat}); 
});

/* Recherche */
app.get('/search', is_authenticated, (req, res) => {
  if(!res.locals.authenticated) { res.redirect('/'); }
  var user = model.fetchUserInformations(req.session.user);
  var users = model.getUsersContains(req.query["q"]);
  var messagesCategory = model.getHearts(model.addIsFromUser(model.getMessagesCategory(req.query["q"]), req.session.user), 0);
  var messagesContains = model.getHearts(model.addIsFromUser(model.getMessagesContains(req.query["q"]), req.session.user), 0);
  res.render('search', {id: req.session.user, messagesCategory, users : users, messagesCategory, messagesContains: messagesContains, userData: user, query: req.query["q"]}); 
});

/* déconnexion */
app.get('/logout', is_authenticated_force, (req, res) => {
  req.session.user = null;
  res.redirect('/'); 
});

app.listen(3000, () => console.log('listening on http://localhost:3000'));

/* MIDDLEWARES */
/* Gestion de la session */
function is_authenticated(req, res, next) {
  if (req.session.user != null && model.getUser(req.session.user) != undefined) { res.locals.authenticated = true; }
  else { res.locals.authenticated = false; }
  next();
}

function is_authenticated_force(req, res, next) {
  if (req.session.user == null  && model.getUser(req.session.user) != undefined) { res.status(401).send("authentication Required"); }
  else { next(); }
};

