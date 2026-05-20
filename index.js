const express = require('express')
const dotenv = require('dotenv')
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId  } = require('mongodb');
dotenv.config()

const uri = process.env.MONGODB_URI;

const app = express()
const port = process.env.PORT

app.use(cors())
app.use(express.json())

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();
    const db = client.db('cat10')
    const AllCatCollection = db.collection('allCards')
    
    app.get('/allCards', async(req, res)=>{
      const result = await AllCatCollection.find().toArray();
      res.json(result);
    })

    // get for email wise data get
    app.get('/myCards', async (req, res) => {
      const userEmail = req.query.email;
      console.log(userEmail)
      const query = { email: userEmail };
      const result = await AllCatCollection.find(query).toArray();
      res.json(result);
    })

    // get for id wise data get
    app.get('/allCards/:id', async (req, res)=>{
      const {id} = req.params;
      const result = await AllCatCollection.findOne({_id: new ObjectId(id)})
      res.json(result);
    })
   

    app.post('/allCards', async (req,res)=>{
      const allCardsData =  req.body
      console.log(allCardsData)
      const result = await AllCatCollection.insertOne(allCardsData)
      res.json(result)
    })

    
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Server running on port ${port}`)
})
