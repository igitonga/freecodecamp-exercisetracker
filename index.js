const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const bodyParser = require('body-parser');
const mongoose = require('mongoose')

app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({extended: false}))

mongoose.connect(process.env.DB_URI)
  .then(result => console.log('Database connected'))
  .catch(error => console.log(error))

const exerciseSchema = new mongoose.Schema({
  userId: String,
  description: String,
  duration: Number,
  date: Date
})

const userSchema = new mongoose.Schema({
  username: String
})

let Exercise = mongoose.model('Execise', exerciseSchema);
let User = mongoose.model('User', userSchema);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/users', async (req, res)=>{

  const userCreated = User({
    username: req.body.username
  })
  await userCreated.save();

  return res.json({
    username: userCreated.username,
    _id: userCreated._id
  })
})

app.get('/api/users', async (req, res)=>{
  let users = await User.find()

  res.json(users)
})

app.post('/api/users/:_id/exercises', async (req, res)=>{
  let userId = req.params._id;
  let description = req.body.description;
  let duration = req.body.duration;
  let date = req.body.date;

  const user = await User.findById(userId);

  const createExercise = Exercise({
    userId: user._id,
    description,
    duration,
    date: date ? new Date(date) : new Date(),
  })

  await createExercise.save();

  return res.json({
    username: user.username,
    description,
    duration: +duration,
    date: new Date(date).toDateString(),
    _id: user._id,
  })
})

app.get('/api/users/:_id/logs', async (req, res)=>{
  let userId = req.params._id;
  let user = await User.findById(userId);
  let filter = {userId}
  let { from, to, limit} = req.query;

  let dateObj = {}
  if(from)
   dateObj['$gte'] = new Date(from)
  if(to)
    dateObj['$lte'] = new Date(to)
  if(from || to)
    filter.date = dateObj

  let exercises = await Exercise.find(filter).limit(+limit ?? 10);

  let logs = exercises.map(e => ({
      description: e.description,
      duration: e.duration,
      date: new Date(e.date).toDateString(),
    })
  )

  res.json({
    username: user.username,
    count: exercises.length,
    _id: "5fb5853f734231456ccb3b05",
    log: logs,
  })
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
