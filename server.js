const express = require('express');
const helmet = require('helmet');
const Users = require('./users/users-model.js');
const server = express();
const bcrypt = require('bcryptjs');

server.use(helmet());
server.use(express.json());

server.post('/api/register', (req, res) => {
  let user = req.body;

  if(!user.username || !user.password) {
    return res.status(500).json({message: 'Need username and password.'})
  };

  const hash = bcrypt.hashSync(user.password, 15);
  user.password = hash;

  Users
    .addUser(user)
    .then(result => {
      res.status(200).json({result});
    })
    .catch(err => {
      res.status(500).json({err});
    })
});

server.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  Users
    .findBy( {username} )
    .first()
    .then(user => {
      console.log(user);
      if(user && bcrypt.compareSync(password, user.password)) {
        res.status(200).json({message: 'Logged In'});
      } else {
        res.status(401).json({message: 'Invalid Credentials.'});
      }
    })
    .catch(err => {
      res.status(500).json({err})
    });
});

server.get('/api/users', authorize, (req, res) => {

  Users
    .getUsers()
    .then(users => {
      res.status(200).json({users});
    })
    .catch(err => {
      res.status(500).json({message: 'Could not retrieve users.'})
    });
});

function authorize(req, res, next) {
  const username = req.headers['x-username'];
  const password = req.headers['x-password'];
  console.log(req.headers);
  if(!username || !password) {
    res.status(500).json({message: 'Need username and password.'})
  };

  Users
    .findBy( {username} )
    .first()
    .then(user => {
      console.log(user);
      if(user && bcrypt.compareSync(password, user.password)) {
        next();
      } else {
        res.status(401).json({message: 'Invalid Credentials.'});
      }
    })
    .catch(err => {
      res.status(500).json({err})
    });
};

// server.use('/api', projectsRouter);

module.exports = server;