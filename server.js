const app = require("./app");
const connectToDatabase= require("./config/db");
const dotenv = require("dotenv");

const cloudinary = require("cloudinary");

dotenv.config({path:"back_end/config/config.env"});


// unhandledRejcection
process.on("uncaughtException",(err)=>{
    console.log("Error: "+err.message);
    console.log("shutting down the server due to uncaught promise Exception ");

        process.exit(1);

});
// handling server error to shut down the process 
connectToDatabase();

cloudinary.config({
    cloud_name:process.env.CLOUDINARY_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET,
})

const Process = app.listen(process.env.PORT,()=>{
    console.log(`Server running at http://localhost:${process.env.PORT}`);
});

// unhandledRejcection
process.on("unhandledRejection",(err)=>{
    console.log("Error: "+err.message);
    console.log("shutting down the server due to unhandled promise Rejection ");
    Process.close(()=>{
        process.exit(1);
    })
    // console.log
})