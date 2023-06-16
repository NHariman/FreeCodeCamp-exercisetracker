const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
let mongoose = require("mongoose");

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post("/api/users", function(req, res, next){
  // save user to db
  // use user object
  next();
}, (req, res) => {
  	res.send("hello");
    // object with 
    // username
    // _id
}); // creates new user using form data: username

app.get("/api/users", function(req, res, next){
  next();
}, (req, res) => {
  	res.send("hello");
    // returns array containing all users
});

app.post("/api/users/:_id/exercises", function(req, res, next){
  // save form data with
  // description
  // duration
  // date, if no date, use current date
  // this is log
  next();
}, (req, res) => {
  	res.send("hello");
    // return user object with
    // exercise fields added
});

app.get("/api/users/:_id/logs", function(req, res, next){
  // can add from, to and limit parameters
  // from: yyyy-mm-dd
  // to: yyyy-mm-dd
  // limit: integer
  next();
}, (req, res) => {
  	res.send("hello");
    // returns user object with a count property representing
    // number of exercises that belong to that user
    // log array contains:
    // description: string
    // duration: number
    // date: Date
});





const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
