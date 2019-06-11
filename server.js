const express = require('express');
const helmet = require('helmet');
const Users = require('./users/users-model.js');
const server = express();
const bcrypt = require('bcryptjs');
const session = require('express-session');
const KnexSessionStore = require('connect-session-knex')(session);

// const sessionConfig = {
//   name: 'monkey',
//   secret: 'keep it secret, keep it safe!',
//   resave: false,
//   saveUninitialized: true,
//   cookie: {
//     maxAge: 1000 * 60 * 10,
//     secure: false,
//     httpOnly: true,
//   },
//   store: new KnexSessionStore({
//     knex: require('./data/dbConfig.js'),
//     tablename: 'sessions',
//     sidfieldname: 'sid',
//     createtable: true,
//     clearInterval: 1000 * 60 * 60,
//   }),
// };

const sessionConfig = {
  name: 'monkey', // by default it would be sid
  secret: 'keep it secret, keep it safe!',
  resave: false, // if there are no changes to the session don't save it,
  saveUninitialized: true, // for GDPR compliance
  cookie: {
    maxAge: 1000 * 60 * 10, // in milliseconds
    secure: false, // send cookie only over https, set to true in production
    httpOnly: true, // always set to true, it means client JS can't access the cookie
  },
  store: new KnexSessionStore({
    // <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
    knex: require('./data/dbConfig.js'),
    tablename: 'sessions',
    sidfieldname: 'sid',
    createtable: true,
    clearInterval: 1000 * 60 * 30,
  }),
};

server.use(helmet());
server.use(express.json());
server.use(session(sessionConfig));

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
      if(user && bcrypt.compareSync(password, user.password)) {
        req.session.userId = user.id;
        req.session.username = user.username;
        console.log(req.session);
        res.status(200).json({message: `Logged In`, userId: req.session.userId});
      } else {
        res.status(401).json({message: 'Invalid Credentials.'});
      }
    })
    .catch(err => {
      res.status(500).json({err})
    });
});

server.get('/api/users', restricted, (req, res) => {
  Users
    .getUsers()
    .then(users => {
      console.log(req.session)
      res.json(users);
    })
    .catch(err => res.send(err));
});

server.delete('/', (req, res) => {
  if(req.session) {
    req.session.destroy();
  }
  res.status(200).json({message: 'goodbye'});
})

server.get('/api/loggedin', (req, res) => {
  
  Users
    .getLoggedInUsers()
    .then(users => {
      res.status(200).json({loggedInUsers: users})
    })
    .catch(err => {
      res.status(500),json({err});
    })
})

// function authorize(req, res, next) {
//   const username = req.headers['x-username'];
//   const password = req.headers['x-password'];
//   console.log(req.headers);
//   if(!username || !password) {
//     res.status(500).json({message: 'Need username and password.'})
//   };

//   Users
//     .findBy( {username} )
//     .first()
//     .then(user => {
//       console.log(user);
//       if(user && bcrypt.compareSync(password, user.password)) {
//         next();
//       } else {
//         res.status(401).json({message: 'Invalid Credentials.'});
//       }
//     })
//     .catch(err => {
//       res.status(500).json({err})
//     });
// };

function restricted(req, res, next) {
  if(req.session && req.session.username) {
    next();
  } else {
    res.status(401).json({message: 'You shall not pass!'})
  }
}

// server.use('/api', projectsRouter);

module.exports = server;