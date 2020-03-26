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
  	return add.lastInsertRowid;
}

/* Fonctions relatives a l'accès de données utilisateur */
exports.fetchUserInformations = (id) => {
	var user = db.prepare('SELECT name, email, lvl, heartReceived, heartGiven, brokenHeartReceived, brokenheartGiven, messageCount, commentCount fanlvl FROM users WHERE (id = ?)').get(id);
  	return user;
}

exports.fetchUserCategory = (id) => {
  var category = db.prepare('SELECT userCategory FROM users WHERE (id = ?)').get(id);
    return category;
}

/*	MEMO	*/
/*
CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT PRIMARY KEY, name TEXT, password TEXT, lvl INTEGER, fanlvl INTEGER, heartReceived INTEGER, 
brokenHeartReceived INTEGER, heartGiven INTEGER, brokenheartGiven INTEGER, userCategory INTEGER, messageCount INTEGER, commentCount INTEGER)

CREATE TABLE messages (id INTEGER PRIMARY KEY AUTOINCREMENT, userId INTEGER, date DATE, content TEXT, category TEXT, heart INTEGER, brokenheart INTEGER)
CREATE TABLE comments (id INTEGER PRIMARY KEY AUTOINCREMENT, messageId INTEGER, userId INTEGER, date DATE, content TEXT, heart INTEGER, brokenheart INTEGER);

usercategory: 0 = user; 1 = moderator; 2 = admin;
*/