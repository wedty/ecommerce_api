const ErrorHandler = require("../utils/errorClass");
const jwt = require("jsonwebtoken");
const asyncErrors = require("./asyncErrors");
const User =require("../models/userModel");
exports.isAuthenticatedUser= asyncErrors(async(req,res,next)=>{
    const {token} = req.cookies;

    if(!token){
        return next(new ErrorHandler("Please Login to access resource"),401);

    }

    const data = jwt.verify(token,process.env.JWT_SECRET_KEY);
    req.user = await User.findById(data.id);
    next();
})

exports.authorizeRoles = (...roles)=>{
    return (req,res,next)=>{
        if(!roles.includes(req.user.role)){
            return ErrorHandler(
                `Role: ${req.user.role} is not allowed to access resource`,403
            );
        }
        next();
    }
}