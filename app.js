const express= require("express");
const cookieParser = require("cookie-parser");
const errorsMiddleware = require("./middleware/errors");
const orderRoute = require("./routes/orderRoute");
const bodyParser = require("body-parser");

const fileUpload = require("express-fileupload");
const dotenv = require("dotenv");

const app = express();



dotenv.config({path:"config/config.env"});
// const cors = require('cors');

// const corsOptions ={
// origin:'http://localhost:3000',
// 'Content-Type': 'Authorization',
// credentials:true,
// optionSuccessStatus:200
// }
// app.use(cors(corsOptions));
app.use(express.json({limit:'50mb', extended: true}));
app.use(express.urlencoded({limit:'50mb',extended:true}));
// app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended:true}));
app.use(fileUpload());


const productRoute = require("./routes/productRoute");
const userRoute = require("./routes/userRoute");
// const orderRoute  = require("./routes/orderRoute");
const paymentRoute = require("./routes/paymentRoute");

app.use("/api/v1",productRoute);
app.use("/api/v1",userRoute);
app.use("/api/v1",orderRoute);
app.use("/api/v1",paymentRoute);


app.use(errorsMiddleware);
module.exports = (app);