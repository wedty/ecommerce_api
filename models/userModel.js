const mongoose = require("mongoose");

const validator = require("validator");

const bcryptJs= require("bcryptjs");

const jwt = require("jsonwebtoken");
const crypto = require("crypto");
// const {  } = require("node:test");

const userSchema = new mongoose.Schema({
    name: {
      type: String,
      required: [true, "Please Enter Your Name"],
      maxLength: [25, "Name cannot exceed 25 characters"],
      minLength: [4, "Name should have more than 4 characters"],
    },
    email: {
      type: String,
      required: [true, "Please Enter Your Email"],
      unique: true,
      validate: [validator.isEmail, "Please Enter a valid Email"],
    },
    password: {
      type: String,
      required: [true, "Please Enter Your Password"],
      minLength: [8, "Password should be greater than 8 characters"],
      select: false,
    },
    avatar: {
      public_id: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
    },
    role: {
      type: String,
      default: "user",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  });
  
// hashing the password before saving to database 
userSchema.pre("validate", async function (next) {
    if (!this.isModified("password")) {
      next();
    }
  
    this.password = await bcryptJs.hash(this.password, 10);
  });
  

// compare hashed password with entered one 

userSchema.methods.comparePassword = async function (password) {
    return await bcryptJs.compare(password, this.password);
  };

  
  userSchema.methods.getJWTToken= function(){
    return jwt.sign({id:this._id}, process.env.JWT_SECRET_KEY,{
        expiresIn:process.env.JWT_EXPIRE
    });


  };

  userSchema.methods.getResetPassToken= function(){
    // generating token 
    const resetPassToken = crypto.randomBytes(20).toString("hex");

    this.resetPasswordToken= crypto
    .createHash("sha256")
    .update(resetPassToken)
    .digest("hex");

    this.resetPasswordExpire = Date.now()+10*60*1000;

    return resetPassToken;
  };


module.exports = mongoose.model("User",userSchema);