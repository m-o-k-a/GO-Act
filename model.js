"use strict"
/* Module pour la BDD en Sqlite3 */
const Sqlite = require('better-sqlite3');
let db = new Sqlite('db.sqlite');

//Encrypt 
const bcrypt = require('bcrypt');

/* Function about connecting, create account */
exports.login = (email, password) => {
  var login = db.prepare('SELECT id FROM users WHERE (email = ?)').get(email);
  if(login == undefined) return undefined;
  if(!comparePassword(password, db.prepare('SELECT password FROM users WHERE email = ?').get(email).password)) return undefined;
  return login.id;
}

exports.new_user = (name, email, password) => {
  var rowCount = db.prepare('SELECT MAX(id) count FROM USERS');
  var cryptedPassword = cryptPassword(password);
  var add = db.prepare('INSERT INTO users (id, name, email, password, userCategory) VALUES(?, ?, ?, ?, ?)').run(rowCount.get().count+1, name, email, cryptedPassword, 0);
  return add.lastInsertRowid-1;
}

/* Function about data encryption */
function cryptPassword(password) {
  var saved_hash = bcrypt.hashSync(password, 10);
  return saved_hash;
}

exports.comparePassword = (password, saved_hash) => {
  return bcrypt.compareSync(password, saved_hash) == true;
};

function comparePassword(password, saved_hash) {
  return bcrypt.compareSync(password, saved_hash) == true;
};


/* Function about user data */
exports.fetchUserInformations = (id) => {
  var user = db.prepare('SELECT id, name, email, userCategory FROM users WHERE (id = ?)').get(id);
  if(user == undefined) return undefined;
  //append to user item from external table
  user.heartGiven = db.prepare('SELECT count(isBroken) count FROM heartrelmsg WHERE userId = ? AND isBroken = 0').get(id).count + db.prepare('SELECT count(isBroken) count FROM heartrelcom WHERE userId = ? AND isBroken = 0').get(id).count;
  user.brokenHeartGiven = db.prepare('SELECT count(isBroken) count FROM heartrelmsg WHERE userId = ? AND isBroken = 1').get(id).count + db.prepare('SELECT count(isBroken) count FROM heartrelcom WHERE userId = ? AND isBroken = 1').get(id).count;
  user.heartReceived = db.prepare('SELECT count(isBroken) count FROM (heartrelmsg JOIN messages ON heartrelmsg.messageId = messages.id) WHERE messages.userId = ? AND isBroken = 0').get(id).count + db.prepare('SELECT count(isBroken) count FROM (heartrelcom JOIN comments ON heartrelCom.commentId = comments.Id) JOIN messages ON comments.messageid = messages.id WHERE messages.userId = ? AND isBroken = 0').get(id).count;
  user.brokenHeartReceived = db.prepare('SELECT count(isBroken) count FROM (heartrelmsg JOIN messages ON heartrelmsg.messageId = messages.id) WHERE messages.userId = ? AND isBroken = 1').get(id).count + db.prepare('SELECT count(isBroken) count FROM (heartrelcom JOIN comments ON heartrelCom.commentId = comments.Id) JOIN messages ON comments.messageid = messages.id WHERE messages.userId = ? AND isBroken = 1').get(id).count;
  user.messageCount = db.prepare('SELECT Count(userId) count FROM messages WHERE userId = ?').get(id).count;
  user.commentCount = db.prepare('SELECT Count(userId) count FROM comments WHERE userId = ?').get(id).count;
  user.profilePic = getProfilePic(user.messageCount, user.userCategory);
  return user;
}

function getProfilePic(messageCount, userCategory) {
  if(userCategory == 2) return "/lvl/lvlADMIN.png";
  else if(userCategory == 1) return "/lvl/lvlMODERATION.png";
  else if(messageCount >= 320 ) return "/lvl/lvlMAX.png";
  else if(messageCount >= 160 ) return "/lvl/lvl5.png";
  else if(messageCount >= 80 ) return "/lvl/lvl4.png";
  else if(messageCount >= 40 ) return "/lvl/lvl3.png";
  else if(messageCount >= 20 ) return "/lvl/lvl2.png";
  else if(messageCount >= 10 ) return "/lvl/lvl1.png";
  else return "/lvl/lvl0.png";
}

exports.fetchUserCategory = (id) => {
  var category = db.prepare('SELECT userCategory FROM users WHERE (id = ?)').get(id);
  return category;
}

exports.fetchUserPassword = (id) => {
  var password = db.prepare('SELECT password FROM users WHERE (id = ?)').get(id);
  return password;
}

function fetchUserCategory(id) {
  var category = db.prepare('SELECT userCategory FROM users WHERE (id = ?)').get(id);
  return category;
}

function getName(id) {
  var user = db.prepare('SELECT name FROM users WHERE (id = ?)').get(id);
  return user.name;
}

exports.getUser = (id) => {
  var user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  return user;
}

exports.emailExist = (email) => {
  var id = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if(id == undefined) return false;
  return true;
}

/* Function about message and comments data */
exports.new_message = (userId, message, category) => {
  var rowCount = db.prepare('SELECT MAX(id) count FROM messages');
  var date = todayDate();
  var userName = getName(userId);
  if (userName == undefined) return;
  var add = db.prepare('INSERT INTO messages (id, userName, userID, date, content, category, heart, brokenheart) VALUES(?, ?, ?, ?, ?, ?, ?, ?)').run(rowCount.get().count+1, userName, userId, date, message, category.toLowerCase(), 0, 0);
}

exports.new_comment = (userId, messageId, comment) => {
  if (userId == undefined || messageId == undefined) return;
  var rowCount = db.prepare('SELECT MAX(id) count FROM comments').get();
  var date = todayDate();
  var userName = getName(userId);
  var add = db.prepare('INSERT INTO comments (id, messageId, userName, userID, date, content, heart, brokenheart) VALUES(?, ?, ?, ?, ?, ?, ?, ?)').run((rowCount.count+1), messageId, userName, userId, date, comment, 0, 0);
}

exports.getMessagesFrom = (id) => {
  var messagesfrom = db.prepare('SELECT * FROM messages WHERE userId = ? ORDER BY id DESC').all(id);
  if (messagesfrom != undefined) return messagesfrom;
}

exports.getUserFrom = (id) => {
  var userfrom = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (userfrom != undefined) return userfrom;
}

exports.getMessages = () => {
  var messages = db.prepare('SELECT * FROM messages ORDER BY id DESC LIMIT 1000').all();
  if(messages != undefined) return messages;
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
  if(comments != undefined) return comments;
}

exports.getComment = (id) => {
  var comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(id);
  if(comment != undefined) return comment;
}

exports.deleteComment = (id) => {
  db.prepare('DELETE FROM comments WHERE id = ?').run(id);
  db.prepare('DELETE FROM heartrelCom WHERE commentId = ?').run(id);
}

/* Function about like and dislike data */
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

/* Function about update user data */
exports.addIsFromUser = (messages, id) => {
  var usercategory = db.prepare('SELECT usercategory FROM users WHERE (id = ?)').get(id).userCategory;
  try { messages.forEach((item) => (item.isFromUser = (id == item.userId || (usercategory == 2 && fetchUserCategory(item.userId).userCategory < 2) || (usercategory == 1 && fetchUserCategory(item.userId).userCategory < 1)))); }
  catch(error) { messages.isFromUser = (id == messages.userId || (usercategory == 2 && fetchUserCategory(messages.userId).userCategory < 2) || (usercategory == 1 && fetchUserCategory(messages.userId).userCategory < 1)); }
  return messages;
}

exports.isAdmin = (id) => {
  if (db.prepare('SELECT usercategory FROM users WHERE (id = ?)').get(id).userCategory == 2) return true;
  return false;
}

exports.canUpdate = (viewUser, id) => {
  var usercategory = db.prepare('SELECT usercategory FROM users WHERE (id = ?)').get(id).userCategory;
  viewUser.canUpdate = ((id == viewUser.id || (usercategory == 2 && viewUser.userCategory < 2)) && viewUser.id != 0) || id == 0; 
  return viewUser;
}

exports.updateUser = (id, name, email, password, category) => {
  if(password === "") { db.prepare('UPDATE  users SET name = ?, email = ?, userCategory = ? WHERE (id = ?)').run(name, email, category, id); }
  else { db.prepare('UPDATE  users SET name = ?, email = ?, password = ?, userCategory = ? WHERE (id = ?)').run(name, email, cryptPassword(password), category, id); }
  db.prepare('UPDATE  messages SET userName = ? WHERE (userId = ?)').run(name, id);
  db.prepare('UPDATE  comments SET userName = ? WHERE (userId = ?)').run(name, id);
  return id;
}

exports.deleteUser = (id) =>{
   db.prepare('DELETE FROM users WHERE id = ?').run(id);
   db.prepare('DELETE FROM messages WHERE userId = ?').run(id);
   db.prepare('DELETE FROM comments WHERE userId = ?').run(id);
   db.prepare('DELETE FROM heartrelMsg WHERE userId = ?').run(id);
   db.prepare('DELETE FROM heartrelCom WHERE userId = ?').run(id);
}

/* Function about search */
exports.getUsersContains = (keyword) => {
  var users = db.prepare('SELECT * FROM users').all();
  return users.filter(item => item.name.toLowerCase().includes(keyword.toString().trim().toLowerCase(), 0));
}

exports.getMessagesCategory = (category) => {
  category = category.trim().toLowerCase();
  var messages = db.prepare('SELECT * FROM messages WHERE category = ? COLLATE NOCASE ORDER BY id DESC').all(category);
  return messages;
}

exports.getMessagesContains = (keyword) => {
  var messages = db.prepare('SELECT * FROM messages ORDER BY id DESC').all();
  return messages.filter(item => item.content.trim().toLowerCase().includes(keyword.toString().toLowerCase(), 0));
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

/* Fonctions leaderboards */
exports.goCount = () => {
  var goCount = db.prepare('SELECT userName, userId, count(id) messageCount FROM messages GROUP BY userName, userId ORDER BY messageCount DESC LIMIT 10').all();
  return goCount;
}

/*exports.goLike = () => {
  //not possible at the time
}*/

/*exports.notLike = () => {
  //not possible at the time
}*/

exports.goFan = () => {
  var goFan = db.prepare('SELECT name, id, sum(isBroken=0) heartGiven FROM (heartrelmsg JOIN users ON heartrelmsg.userId = users.id) GROUP BY name, id ORDER BY heartGiven DESC LIMIT 10').all();
  return goFan;
}

exports.notFan = () => {
  var notFan = db.prepare('SELECT name, id, sum(isBroken=1) brokenheartGiven FROM (heartrelmsg JOIN users ON heartrelmsg.userId = users.id) GROUP BY name, id ORDER BY brokenheartGiven DESC LIMIT 10').all();
  return notFan;
}

exports.goBest = (id) => {
  var goBest = db.prepare('SELECT id, userName, messages.userId, date, content, category, sum(isBroken=0) heart, sum(isBroken=1) brokenheart FROM (messages JOIN heartrelmsg ON messages.id = heartrelmsg.messageid) GROUP BY id, userName, messages.userId, date, content, category ORDER BY heart DESC LIMIT 10').all();
  return goBest;
}

exports.notBest = (id) => {
  var notBest = db.prepare('SELECT id, userName, messages.userId, date, content, category, sum(isBroken=0) heart, sum(isBroken=1) brokenheart FROM (messages JOIN heartrelmsg ON messages.id = heartrelmsg.messageid) GROUP BY id, userName, messages.userId, date, content, category ORDER BY brokenheart DESC LIMIT 10').all();
  return notBest;
}

/*
exports.goMment = (id) => {
  //not possible at the time
}
*/