const mongoose = require("mongoose");

const connectToDatabase = ()=>{
  mongoose.connect(
    process.env.MONGODB_URI,{
        useNewUrlParser:true,
        useUnifiedTopology:true,
       
    }).then(console.log("Connected to MongoDb")).catch((err)=>console.log(err));

}


module.exports= connectToDatabase;