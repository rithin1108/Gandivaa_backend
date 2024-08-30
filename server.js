import express from 'express';
import { MongoClient } from 'mongodb';

const app = express();
const port = 9000;

app.use(express.json());  

// MongoDB connection setup
const url = 'mongodb://localhost:27017';
const dbName = 'ast';
let db;

MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true })
  .then((client) => {
    console.log('Connected successfully to MongoDB server');
    db = client.db(dbName);
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB', err);
  });

// Routes
app.get('/', (req, res) => {
  res.send({ message: 'Hiiii guys ..myself siddhu' });
});

app.get('/data', (req, res) => {
  res.json({ message: 'Hello friends..How do you do' });
});

app.post('/data', (req, res) => {
  const newData = req.body;
  res.status(201).json({ message: 'Data received', data: newData });
});

app.put('/data/:id', (req, res) => {
  const id = req.params.id;
  const updatedData = req.body;
  res.json(`{ message: Data with id ${id} updated, data: updatedData }`);
});

// Uncommented MongoDB-related routes
app.post('/ast', async(req, res)  => {
    await db.collection("ast").find().toArray()
    .then((result) => {
        res.json(result)
    })
    .catch((e) => console.log(e))
});  

app.post('/insert', async(req, res) => {
    await db.collection("ast").insertOne({Name:req.body.name,Team:req.body.team})
    .then((result)=>{
        res.json(result)
    })
    .catch((e)=>console.log(e))
});

app.post('/find', async(req, res) => {
    await db.collection("ast").findOne({Name:req.body.name,Team:req.body.team})
    .then((result)=>{
        res.json(result)
    })
    .catch((e)=>console.log(e))
});

app.post('/signup', async(req, res) => {
  await db.collection("users").insertOne({username:req.body.username, password:req.body.password,email:req.body.email,mobile_number:req.body.mobile_number})
  .then((result)=>{
      res.json(result)
  }).catch((e)=>console.log(e))
})

app.post('/findmany', async(req, res) => {
    await db.collection("ast").find(req.body).toArray()
    .then((result)=>{
        res.json(result)
    })
    .catch((e)=>console.log(e))
});

app.post('/update', async(req, res) => {
    await db.collection("ast").updateOne({Name:req.body.name,Team:req.body.team}, { $set: req.body })
    .then((result)=>{
        res.json(result)
    })
    .catch((e)=>console.log(e))
});

app.post('/updatemany', async(req, res) => {
    await db.collection("ast").updateMany(req.body.filter, { $set: req.body.update })
    .then((result)=>{
        res.json(result)
    })
    .catch((e)=>console.log(e))
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});