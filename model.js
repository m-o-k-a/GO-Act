"use strict"
/* Module pour la BDD en Sqlite3 */
const Sqlite = require('better-sqlite3');
let db = new Sqlite('db.sqlite');

/* Fonctions relatives a la conenction */
exports.login = (email, password) => {
  var login = db.prepare('SELECT id FROM user WHERE (emain = ? AND password = ?)').get(email, password);
  if(login == undefined) return -1;
  return login;
}

exports.new_user = (name, email, password) => {
  var add = db.prepare('INSERT INTO user (name, email, password) VALUES(?, ?, ?)').run(name, email, password);
  return add.lastInsertRowid;
}