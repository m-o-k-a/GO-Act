"use strict"
/* Module pour la BDD en Sqlite3 */
const Sqlite = require('better-sqlite3');
let db = new Sqlite('db.sqlite');

/* Fonctions relatives a la conenction */
exports.login = (email, password) => {
  var login = db.prepare('SELECT id FROM users WHERE (email = ? AND password = ?)').get(email, password);
  if(login == undefined) return -1;
  console.log(login.id);
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

/* Fonctions relatives a l'accès de données messages */
exports.new_message = (userId, message, category) => {
  //car auto increment marche pas
  var rowCount = db.prepare('SELECT COUNT(id) count FROM messages');
  var date = todayDate();
  var userName = getName(userId);
  if (userName == -1) return;
  var add = db.prepare('INSERT INTO messages (id, userName, userID, date, content, category, heart, brokenheart) VALUES(?, ?, ?, ?, ?, ?, ?, ?)').run(rowCount.get().count, userName, userId, date, message, category, 0, 0);
}

exports.getMessages = () => {
  var messages = db.prepare('SELECT * FROM messages ORDER BY id DESC').all();
  if(messages != -1) return messages;
}

exports.getMessage = (id) => {
  var message = db.prepare('SELECT * FROM messages WHERE id = ?').get(id);
  console.log(message);
  if(message != -1) return message;
}

/* Fonctions relatives a l'accès de données des coeurs */
exports.heart = (userId, messageId) => {
  var messageAdd = db.prepare('INSERT INTO heartref (userId, messageId) VALUES(?, ?)').run(userId, messageId);
  var messageHeart = db.prepare('SELECT heart FROM messages WHERE id = ?').get(Id);
  messageHeart = messageHeart.heart++;
  console.log(messageHeart);
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