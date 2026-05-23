const express = require('express')
const dotenv = require('dotenv')
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId  } = require('mongodb');
const { jwtVerify, createRemoteJWKSet } = require('jose-cjs');
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
// for verify jwks-
const JWKS = createRemoteJWKSet(
  new URL(`${process.env.CLIENT_URL}/api/auth/jwks`)
)


// middleware for server
const verifyToken = async (req, res, next)=>{
      const authHeader = req.headers.authorization 
      //client teke call korce
      if(!authHeader){
        return res.status(401).json({ message: "Unauthorized"})
      }
      const token = authHeader.split(" ")[1]
      if (!token) {
        return res.status(401).json({ message: "Unauthorized"})
      }
      console.log(token);
      
      // for verify
      try {
        const {payload} = await jwtVerify(token,JWKS)
      console.log(payload);
           
        next()

      } catch (error) {
        return res.status(403).json({ message: "Forbidden"})
      }
 
      
    }


async function run() {
  try {
    // await client.connect();
    const db = client.db('cat10')
    const AllCatCollection = db.collection('allCards');
    const AdoptionCollection = db.collection('adopting')
    
    
    // allCards GET - search, filter, sort
    app.get('/allCards', async (req, res) => {
      try {
        const { search, species, sort } = req.query;
        let query = {};

        if (search) {
          query.petName = { $regex: search, $options: 'i' };
        }

        // if (species) {
        //   query.species = { $in: [species] };
        // }
        if (species && species.trim() !== '') {
          const speciesList = species.split(',');
          query.species = { $in: speciesList };
        }

        let sortOption = {};
        if (sort === 'asc') sortOption = { adoptionFee: 1 };
        else if (sort === 'desc') sortOption = { adoptionFee: -1 };

        const result = await AllCatCollection.find(query).sort(sortOption).toArray();
        res.json(result);
      } catch (error) {
        res.status(500).json({ message: error.message });
      }               
    })


    // get for email wise data get
    app.get('/myCards', async (req, res) => {
      const userEmail = req.query.email;
      console.log(userEmail)
      const query = { ownerEmail: userEmail };
      const result = await AllCatCollection.find(query).toArray();
      res.json(result);
    })

    // delete card data , er jonne api make korchi
    app.delete('/allCards/:id', async(req, res)=>{
      const {id} = req.params
      const result = await AllCatCollection.deleteOne({_id: new ObjectId(id)})
      res.json(result);
    })

    // form teke j data get kori seta card ee dka jay oita edit korbo akn patch kore
    app.patch('/allCards/:id',async (req, res)=>{
      const {id} = req.params;
      const updateData = req.body
      const result = await AllCatCollection.updateOne(
        {_id: new ObjectId(id)},
        {$set: updateData}
      )
      res.json(result);
    })

    // get for id wise data get
    app.get('/allCards/:id',verifyToken, async (req, res)=>{
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

    // for adoption form
    app.post('/adopting', async (req,res)=>{
      const allAdoptionData =  req.body
      
      const result = await AdoptionCollection.insertOne(allAdoptionData) 
      res.json(result)
    })

    // get for email wise data get for my resuest showing
    app.get('/adopting', async (req, res) => {
      const userEmail = req.query.email;
      
      const query = { userEmail: userEmail };
      const result = await AdoptionCollection.find(query).toArray();
      res.json(result);
    })

    // delete card data adoption req. data
    app.delete('/adopting/:id', async(req, res)=>{
      const {id} = req.params
      const result = await AdoptionCollection.deleteOne({_id: new ObjectId(id)})
      res.json(result);
    })



    
    // await client.db("admin").command({ ping: 1 });
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