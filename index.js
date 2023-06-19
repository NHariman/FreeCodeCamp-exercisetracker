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

const ExerciseSchema = new mongoose.Schema({
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

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
    required: true,
  },
  count: 0,
  logs: [ExerciseSchema],
});

const User = mongoose.model('User', userSchema);
const Exercise = mongoose.model('Exercise', ExerciseSchema);

const createAndSaveUser = (newUsername, done) => {
  const newUser = new User({
    username: newUsername,
  });
  newUser.save((err, data) => {
    if (err) return done(err, null);
    return done(null, data);
  });
};

app.post('/api/users', (req, res) => {
  res.user = createAndSaveUser(req.body.username, (err, data) => {
    if (err) {
      return res.send({
        error: 'User already exists',
      });
    }
    return res.send({
      username: data.username,
      _id: data._id,
    });
  });
});
// object with
// username
// _id
// creates new user using form data: username

const getAllUsers = (done) => {
  User.find().exec((err, data) => {
    if (err) return console.error(err);
    return done(null, data);
  });
};

app.get('/api/users', (req, res) => {
  getAllUsers((err, data) => {
    if (err) {
      res.send({
        error: 'cannot get users',
      });
      return;
    }
    res.send(data);
  });
  // returns array containing all users
});

function formatDate(date) {
  const split = date.split(' ');
  split[0] = split[0].replace(/,/g, '');
  const newString = `${split[0]} ${split[2]} ${split[1]} ${split[3]}`;
  return newString;
}

app.post('/api/users/:_id/exercises', async (req, res) => {
  const newLog = new Exercise({
    description: req.body.description,
    duration: parseInt(req.body.duration),
    date: req.body.date
      ? new Date(req.body.date) : new Date(),
  });
  const updatedUser = await User.findByIdAndUpdate(
    req.params._id,
    { $push: { logs: newLog }, $inc: { count: 1 } },
    {
      new: true,
    },
  );
  res.json({
    _id: updatedUser._id,
    username: updatedUser.username,
    date: formatDate(updatedUser.logs[updatedUser.logs.length - 1].date.toUTCString()),
    duration: updatedUser.logs[updatedUser.logs.length - 1].duration,
    description: updatedUser.logs[updatedUser.logs.length - 1].description,
  });
});

app.get('/api/users/:_id/logs/:limit?/:from?/:to?', async (req, res) => {
  const getUser = await User.findById(req.params._id);
  if (!getUser) {
    return res.send({
      error: 'bad input',
    });
  }
  getUser.logs.sort((a, b) => new Date(b.date) - new Date(a.date));
  let newLogs;
  if (req.query.from) {
    const fromTime = new Date(req.query.from).getTime();
    newLogs = getUser.logs.filter((log) => {
      const logTime = new Date(log.date).getTime();
      return (logTime > fromTime);
    });
    getUser.logs = newLogs;
  }
  if (req.query.to) {
    const toTime = new Date(req.query.to).getTime();
    newLogs = getUser.logs.filter((log) => {
      const logTime = new Date(log.date).getTime();
      return (logTime < toTime);
    });
    getUser.logs = newLogs;
  }
  if (req.query.limit) {
    newLogs = getUser.logs.slice(0, req.query.limit);
    getUser.logs = newLogs;
  }
  return res.send({
    username: getUser.username,
    count: getUser.count,
    _id: getUser._id,
    log: getUser.logs.map((log) => ({
      description: log.description,
      duration: log.duration,
      date: formatDate(log.date.toUTCString()),
    })),
  });
});

// You can make a GET request to /api/users/:_id/logs to retrieve a full exercise log of any user.

const getUserLogs = (userId, queries, done) => {
  Exercise.find({
    user_id: userId,
  })
    .limit(queries.limit)
    .select('description duration date')
    .exec((err, data) => {
      if (err) return console.error(err);
      done(null, data);
    });
};

// app.get('/api/users/:_id/logs', (req, res, next) => {
//   const getQueries = {
//     from: req.query.from ? new Date(req.query.from) : null,
//     to: req.query.to ? new Date(req.query.to) : null,
//     limit: req.query.limit ? parseInt(req.query.limit) : null,
//   };
//   res.log = getUserLogs(req.params._id, getQueries, (err, data) => {
//     if (err) {
//       console.error(err);
//       return;
//     }
//     console.log(data);
//   });
//   res.log.filter((item) => item.date.getTime() >= getQueries.from.getTime()
//   && item.date.getTime() <= getQueries.to.getTime());
//   res.user = findUserById(req.params._id, (err, data) => {
//     if (err) {
//       console.error(err);
//       return;
//     }
//     console.log(data);
//   });
//   res.count = res.log.length;
//   // can add from, to and limit parameters
//   // from: yyyy-mm-dd
//   // to: yyyy-mm-dd
//   // limit: integer
//   next();
// }, (req, res) => {
//   res.send({
//     username: res.user.username,
//     count: res.count,
//     _id: res.user._id,
//     log: res.log,
//   });
//   // returns user object with a count property representing
//   // number of exercises that belong to that user
//   // log array contains:
//   // description: string
//   // duration: number
//   // date: Date
// });

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log(`Your app is listening on port ${listener.address().port}`);
});
