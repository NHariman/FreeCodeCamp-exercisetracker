const express = require('express');

const app = express();
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.use(cors());
app.use(require('body-parser').urlencoded({ extended: false }));

app.use(express.static('public'));
app.get('/', (req, res) => {
  res.sendFile(`${__dirname}/views/index.html`);
});

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
    required: true,
  },
});

const ExerciseSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  user_id: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  duration: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
});

const User = mongoose.model('User', userSchema);
const Exercise = mongoose.model('Exercise', ExerciseSchema);

const findUserInDatabase = (user, done) => {
  User.findOne({
    username: user,
  }).exec((err, data) => {
    if (err) return console.error(err);
    return done(null, data);
  });
};

const createAndSaveUser = (newUsername, done) => {
  const newUser = new User({
    username: newUsername,
  });
  newUser.save((err, data) => {
    if (err) return console.error(err);
    return done(null, data);
  });
};

app.post('/api/users', (req, res, next) => {
  const foundUser = findUserInDatabase(req.body.username);
  if (!foundUser) {
    res.user = createAndSaveUser(req.body.username);
  } else {
    res.user = foundUser;
  }
  next();
}, (req, res) => {
  res.send({
    _id: res.user._id,
    username: res.user.username,
  });
  // object with
  // username
  // _id
}); // creates new user using form data: username

const getAllUsers = (done) => {
  User.find().exec((err, data) => {
    if (err) return console.error(err);
    return done(null, data);
  });
};

app.get('/api/users', (req, res, next) => {
  next();
}, (req, res) => {
  const getUsers = getAllUsers();
  res.send(getUsers);
  // returns array containing all users
});

const createAndSaveExercise = (userData, bodyData, done) => {
  const newLog = new Exercise({
    username: userData.username,
    user_id: bodyData._id,
    description: bodyData.description,
    duration: parseInt(bodyData.duration),
    date: bodyData.date,
  });
  newLog.save((err, data) => {
    if (err) return console.error(err);
    return done(null, data);
  });
};

const findUserById = (userId, done) => {
  User.findOne({
    id: userId,
  }).exec((err, data) => {
    if (err) return console.error(err);
    return done(null, data);
  });
};

app.post('/api/users/:_id/exercises', (req, res, next) => {
  const findUser = findUserById(req.params._id);
  if (!findUser) {
    res.invalidUser = true;
  } else {
    res.invalidUser = false;
    if (!req.body.date) {
      req.body.date = new Date();
    } else {
      req.body.date = new Date(req.body.date);
    }
    res.exercise = createAndSaveExercise(findUser, req.body);
  }
  // save form data with
  // username: string
  // _id: userId
  // description: string
  // duration: number
  // date: Date, if no date, current date
  // this is log
  next();
}, (req, res) => {
  if (res.invalidUser === true) {
    res.send({
      error: 'Invalid ID',
    });
  } else {
    res.send({
      username: res.exercise.username,
      description: res.exercise.description,
      duration: res.exercise.duration,
      date: res.exercise.date,
      _id: res.exercise._id,
    });
  }
  // return user object with
  // exercise fields added
});

const findExercisesByUserId = (userId, done) => {
  Exercise.find({
    user_id: userId,
  }).exec((err, data) => {
    if (err) return console.error(err);
    return done(null, data);
  });
};

app.get('/api/users/:_id/exercises', (req, res, next) => {
  res.exercises = findExercisesByUserId(req.params._id);
  next();
}, (req, res) => {
  if (res.invalidUser === true) {
    res.send({
      error: 'Invalid ID',
    });
  } else {
    res.send(res.exercises);
  }
  // return user object with
  // exercise fields added
});

const getUserLogs = (userId, queries, done) => {
  Exercise.find({
    user_id: userId,
  })
    .limit(queries.limit)
    .select('description duration date')
    .exec((err, data) => {
      if (err) return console.error(err);
      return done(null, data);
    });
};

app.get('/api/users/:_id/logs', (req, res, next) => {
  const getQueries = {
    from: req.query.from ? new Date(req.query.from) : null,
    to: req.query.to ? new Date(req.query.to) : null,
    limit: req.query.limit ? parseInt(req.query.limit) : null,
  };
  res.log = getUserLogs(req.params._id, getQueries);
  res.log.filter((item) => item.date.getTime() >= getQueries.from.getTime()
  && item.date.getTime() <= getQueries.to.getTime());
  res.user = findUserById(req.params._id);
  res.count = res.log.length;
  // can add from, to and limit parameters
  // from: yyyy-mm-dd
  // to: yyyy-mm-dd
  // limit: integer
  next();
}, (req, res) => {
  res.send({
    username: res.user.username,
    count: res.count,
    _id: res.user._id,
    log: res.log,
  });
  // returns user object with a count property representing
  // number of exercises that belong to that user
  // log array contains:
  // description: string
  // duration: number
  // date: Date
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log(`Your app is listening on port ${listener.address().port}`);
});
