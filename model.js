"use strict"
/* Module pour la BDD en Sqlite3 */
const Sqlite = require('better-sqlite3');
let db = new Sqlite('db.sqlite');

/* Fonctions relatives a la conenction */
exports.login = (email, password) => {
  var login = db.prepare('SELECT id FROM users WHERE (email = ? AND password = ?)').get(email, password);
  if(login == undefined) return -1;
  return login.id;
}

exports.new_user = (name, email, password) => {
	//car auto increment marche pas
	var rowCount = db.prepare('SELECT COUNT(id) count FROM USERS');
  var add = db.prepare('INSERT INTO users (id, name, email, password, lvl, fanlvl, heartReceived, brokenHeartReceived, heartGiven, brokenheartGiven, messageCount, commentCount, userCategory) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(rowCount.get().count, name, email, password, 0, 0, 0, 0, 0, 0, 0, 0, 0);
  	return add.lastInsertRowid-1;
}

/* Fonctions relatives a l'accès de données utilisateur */
exports.fetchUserInformations = (id) => {
	var user = db.prepare('SELECT name, email, lvl, fanlvl, heartReceived, heartGiven, brokenHeartReceived, brokenheartGiven, messageCount, commentCount FROM users WHERE (id = ?)').get(id);
  	return user;
}

exports.fetchUserCategory = (id) => {
  var category = db.prepare('SELECT userCategory FROM users WHERE (id = ?)').get(id);
    return category;
}

function getName(id) {
    var user = db.prepare('SELECT name FROM users WHERE (id = ?)').get(id);
    return user.name;
}

exports.getUser = (id) => {
  var user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if(user != -1) return user;
}

/* Fonctions relatives a l'accès de données messages */
exports.new_message = (userId, message, category) => {
  //car auto increment marche pas
  var rowCount = db.prepare('SELECT COUNT(id) count FROM messages');
  var date = todayDate();
  var userName = getName(userId);
  if (userName == -1) return;
  var add = db.prepare('INSERT INTO messages (id, userName, userID, date, content, category, heart, brokenheart) VALUES(?, ?, ?, ?, ?, ?, ?, ?)').run(rowCount.get().count, userName, userId, date, message, category, 0, 0);
  var userMessages = db.prepare('SELECT messageCount from users where id = ?').get(userId);
  userMessages = userMessages.messageCount;
  userMessages++;
  db.prepare('UPDATE users SET messageCount = ? where id = ?').run(userMessages, userId);
}

exports.new_comment = (userId, messageId, comment) => {
  //car auto increment marche pas
  if (userId == -1 || messageId == -1) return;
  var rowCount = db.prepare('SELECT COUNT(id) count FROM comments where messageId = ?').get(messageId);
  var date = todayDate();
  var userName = getName(userId);
  var add = db.prepare('INSERT INTO comments (id, messageId, userName, userID, date, content, heart, brokenheart) VALUES(?, ?, ?, ?, ?, ?, ?, ?)').run(rowCount.count, messageId, userName, userId, date, comment, 0, 0);
  var userComments = db.prepare('SELECT commentCount from users where id = ?').get(userId);
  console.log(userComments);
  userComments = userComments.commentCount;
  userComments++;
  db.prepare('UPDATE users SET commentCount = ? where id = ?').run(userComments, userId);
}

exports.getMessagesFrom = (id) => {
    var messagesfrom = db.prepare('SELECT * FROM messages WHERE userId = ?').all(id);
    if (messagesfrom != -1) return messagesfrom;
}

exports.getMessages = () => {
  var messages = db.prepare('SELECT * FROM messages ORDER BY id DESC').all();
  if(messages != -1) return messages;
}

exports.getMessage = (id) => {
  var message = db.prepare('SELECT * FROM messages WHERE id = ?').get(id);
  if(message != -1) return message;
}

exports.getComments = (id) => {
  var comments = db.prepare('SELECT * FROM comments WHERE messageid = ? ORDER BY id DESC').all(id);
  if(comments != -1) return comments;
}

/* Fonctions relatives a l'accès de données des coeurs */
exports.heart = (userId, messageId) => {
  var messageAdd = db.prepare('INSERT INTO heartref (userId, messageId) VALUES(?, ?)').run(userId, messageId);
  var messageHeart = db.prepare('SELECT heart FROM messages WHERE id = ?').get(Id);
  messageHeart = messageHeart.heart++;
}

/* Fonctions leaderboards */
/* TODO A FACTORISER AVEC PARAMS */
exports.goCount = () => {
  var goCount = db.prepare('SELECT name, id, messageCount FROM users WHERE messageCount > 0 ORDER BY messageCount DESC LIMIT 10').all();
  if(goCount != -1) return goCount;
}

exports.goLike = () => {
  var goLike = db.prepare('SELECT name, id, heartReceived FROM users WHERE heartReceived > 0 ORDER BY heartReceived DESC LIMIT 10').all();
  if(goLike != -1) return goLike;
}

exports.notLike = () => {
  var notLike = db.prepare('SELECT name, id, brokenheartReceived FROM users WHERE brokenheartReceived > 0 ORDER BY brokenheartReceived DESC LIMIT 10').all();
  if(notLike != -1) return notLike;
}

exports.goFan = () => {
  var goFan = db.prepare('SELECT name, id, heartGiven FROM users WHERE heartGiven > 0 ORDER BY heartGiven DESC LIMIT 10').all();
  if(goFan != -1) return goFan;
}

exports.notFan = () => {
  var notFan = db.prepare('SELECT name, id, brokenheartGiven FROM users WHERE brokenheartGiven > 0 ORDER BY brokenheartGiven DESC LIMIT 10').all();
  if(notFan != -1) return notFan;
}

exports.goBest = (id) => {
  var goBest = db.prepare('SELECT * FROM messages WHERE heart > 0 ORDER BY heart DESC LIMIT 10').all();
  if(goBest != -1) return goBest;
}

exports.notBest = (id) => {
  var notBest = db.prepare('SELECT * FROM messages WHERE brokenheart > 0 ORDER BY brokenheart DESC LIMIT 10').all();
  if(notBest != -1) return notBest;
}

exports.goMment = (id) => {
  var goMment = db.prepare('SELECT * FROM comments WHERE heart > 0 ORDER BY heart DESC LIMIT 10').all();
  if(goMment != -1) return goMment;
}


/* Fonctions relativex aux dates */
function todayDate() {
  var today = new Date();
  var dd = String(today.getDate()).padStart(2, '0');
  var mm = String(today.getMonth() + 1).padStart(2, '0');
  var yyyy = today.getFullYear();
  today = mm+'/'+dd+'/'+yyyy;
  return today;
} 

/*	MEMO	*/
/*
  if(messageAdd != -1) {
    db.prepare('UPDATE messages SET heart=? WHERE id = ?').get(messageHeart, Id);
  }
CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT PRIMARY KEY, name TEXT, password TEXT, lvl INTEGER, fanlvl INTEGER, heartReceived INTEGER, 
brokenHeartReceived INTEGER, heartGiven INTEGER, brokenheartGiven INTEGER, userCategory INTEGER, messageCount INTEGER, commentCount INTEGER)

CREATE TABLE messages (id INTEGER PRIMARY KEY AUTOINCREMENT, userId INTEGER, date DATE, content TEXT, category TEXT, heart INTEGER, brokenheart INTEGER)
CREATE TABLE comments (id INTEGER PRIMARY KEY AUTOINCREMENT, messageId INTEGER, userId INTEGER, date DATE, content TEXT, heart INTEGER, brokenheart INTEGER);

HEARTREF(messageid INTEGER, userid INTEGER) both primary key
BROKENHEARTREF(messageid INTEGER, userid INTEGER) both primary key

usercategory: 0 = user; 1 = moderator; 2 = admin;
*/