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
  var rowCount = db.prepare('SELECT MAX(id) count FROM messages');
  var date = todayDate();
  var userName = getName(userId);
  if (userName == -1) return;
  var add = db.prepare('INSERT INTO messages (id, userName, userID, date, content, category, heart, brokenheart) VALUES(?, ?, ?, ?, ?, ?, ?, ?)').run(rowCount.get().count+1, userName, userId, date, message, category, 0, 0);
  var userMessages = db.prepare('SELECT messageCount from users where id = ?').get(userId);
  userMessages = userMessages.messageCount;
  userMessages++;
  db.prepare('UPDATE users SET messageCount = ? where id = ?').run(userMessages, userId);
}

exports.new_comment = (userId, messageId, comment) => {
  //car auto increment marche pas
  if (userId == -1 || messageId == -1) return;
  var rowCount = db.prepare('SELECT MAX(id) count FROM comments').get();
  var date = todayDate();
  var userName = getName(userId);
  var add = db.prepare('INSERT INTO comments (id, messageId, userName, userID, date, content, heart, brokenheart) VALUES(?, ?, ?, ?, ?, ?, ?, ?)').run(rowCount.count+1, messageId, userName, userId, date, comment, 0, 0);
  var userComments = db.prepare('SELECT commentCount from users where id = ?').get(userId);
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

exports.deleteMessage = (id) => {
  db.prepare('DELETE FROM messages WHERE id = ?').run(id);
  db.prepare('DELETE FROM heartrelMsg WHERE messageId = ?').run(id);
  db.prepare('DELETE FROM comments WHERE messageId = ?').run(id);
}

exports.getComments = (id) => {
  var comments = db.prepare('SELECT * FROM comments WHERE messageid = ? ORDER BY id DESC').all(id);
  if(comments != -1) return comments;
}

exports.getComment = (id) => {
  var comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(id);
  if(comment != -1) return comment;
}

exports.deleteComment = (id) => {
  db.prepare('DELETE FROM comments WHERE id = ?').run(id);
  db.prepare('DELETE FROM heartrelCom WHERE commentId = ?').run(id);
}

/* Fonctions relatives a l'accès de données des coeurs */
exports.getHeart = (messageId, isBroken, isComment) => {
  if(isComment) { var count = db.prepare('SELECT count(userId) count FROM heartrelCom WHERE commentId = ? AND isBroken = ?').get(messageId, isBroken); }
  else { var count = db.prepare('SELECT count(userId) count FROM heartrelMsg WHERE messageId = ? AND isBroken = ?').get(messageId, isBroken); }
  return count.count;
}
function getHeart(messageId, isBroken, isComment) {
  if(isComment) { var count = db.prepare('SELECT count(userId) count FROM heartrelCom WHERE commentId = ? AND isBroken = ?').get(messageId, isBroken); }
  else { var count = db.prepare('SELECT count(userId) count FROM heartrelMsg WHERE messageId = ? AND isBroken = ?').get(messageId, isBroken); }
  return count.count;
}

exports.addHeart = (userId, messageId, isBroken, isComment) => {
  if(isComment) {
    var data = db.prepare('SELECT * FROM heartrelCom WHERE commentId = ? AND userid = ?').get(messageId, userId);
    if (data == undefined) { var add = db.prepare('INSERT INTO heartrelCom (commentId, userId, isBroken) VALUES(?, ?, ?)').run(messageId, userId, isBroken); }
    else {
      db.prepare('DELETE FROM heartrelCom WHERE commentId = ? AND userId = ?').run(messageId, userId);
      if((data.isBroken == 0 && isBroken == 1) || (data.isBroken == 1 && isBroken == 0)) { db.prepare('INSERT INTO heartrelCom (commentId, userid, isBroken) VALUES(?, ?, ?)').run(messageId, userId, isBroken); }
    }

  }
  else {
    var data = db.prepare('SELECT * FROM heartrelMsg WHERE messageId = ? AND userid = ?').get(messageId, userId);
    if (data == undefined) { var add = db.prepare('INSERT INTO heartrelmsg (messageId, userId, isBroken) VALUES(?, ?, ?)').run(messageId, userId, isBroken); }
    else {
      db.prepare('DELETE FROM heartrelMsg WHERE messageId = ? AND userId = ?').run(messageId, userId);
      if((data.isBroken == 0 && isBroken == 1) || (data.isBroken == 1 && isBroken == 0)) { db.prepare('INSERT INTO heartrelMsg (messageId, userid, isBroken) VALUES(?, ?, ?)').run(messageId, userId, isBroken); }
    }
  }
}

exports.getHearts = (messages, isComment) => {
  try { messages.forEach((item) => (item.heart = getHeart(item.id, 0, isComment))); messages.forEach((item) => (item.brokenheart = getHeart(item.id, 1, isComment))); }
  catch(error) { messages.heart = getHeart(messages.id, 0, isComment); messages.brokenheart = getHeart(messages.id, 1, isComment); }
  return messages;
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

/* Fonction pour la supression disponible si l'utilisateur est le bon ou a les droits */
exports.addIsFromUser = (messages, id) => {
  var usercategory = db.prepare('SELECT usercategory FROM users WHERE (id = ?)').get(id).userCategory;
  try { messages.forEach((item) => (item.isFromUser = (id == item.userId || usercategory == 2))); }
  catch(error) { messages.isFromUser = (id == messages.userId || usercategory == 2); }
  return messages;
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

/*  MEMO  */
/*
CREATE TABLE users (id INTEGER NOT NULL, email TEXT, name TEXT, password TEXT, lvl INTEGER, fanlvl INTEGER, heartReceived INTEGER, brokenHeartReceived INTEGER, heartGiven INTEGER, brokenHeartGiven INTEGER, messageCount INTEGER, commentCount INTEGER, userCategory INTEGER,
PRIMARY KEY (id, email));

CREATE TABLE messages (id INTEGER PRIMARY KEY, userName TEXT, userId INTEGER, date TEXT, content TEXT, category TEXT, heart INTEGER, brokenheart INTEGER);

CREATE TABLE comments (id INTEGER NOT NULL, messageId INTEGER NOT NULL, userName TEXT, userId INTEGER, date TEXT, content TEXT, heart INTEGER, brokenheart INTEGER, PRIMARY KEY(id, messageId));

CREATE TABLE heartRelMsg (messageid INTEGER, userid INTEGER, isBroken INTEGER, PRIMARY KEY(messageid, userid));

CREATE TABLE heartRelCom (commentid INTEGER, userid INTEGER, isBroken INTEGER, PRIMARY KEY(commentid, userid));
*/