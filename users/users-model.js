const db = require('../data/dbConfig.js');

module.exports = {
  getUsers,
  addUser,
  findBy
};

function getUsers() {
  return db('users');
};

function addUser(user) {
  return db('users')
    .insert(user);
};

function findBy(query) {
  return db('users')
    .where(query);
};