const asyncErrors = require("../middleware/asyncErrors");
const User = require("../models/userModel");
const ErrorHandler = require("../utils/errorClass");
const addToken = require("../utils/jwt_token")
const crypto= require("crypto")
const sendPasswordResetMail= require("../utils/resetPassMail");
const cloudinary= require("cloudinary");

exports.registerUser = asyncErrors(async(req,res,next)=>{
    const {name, email,password} = req.body;

    const myCloud = await cloudinary.v2.uploader.upload_large(req.body.avatar,{
        folder:"avatars",
        width:150,
        crop:"scale",
    });

    const user = await User.create({
        name,
        email,
        password,
        avatar:{
            public_id:myCloud.public_id,
            url:myCloud.secure_url,

        },


    });
    console.log(user);

    addToken(user,201,res);
});

exports.loginUser = asyncErrors(async(req,res,next)=>{
    const {email,password}= req.body;
    // console.log(email);
    if(!email || !password){
        return next( new ErrorHandler("Please Enter Email and Password"),400);
    }
    const user =await User.findOne({email}).select("+password");

    if(!user){
        return next(new ErrorHandler("Invalid email or password"),401);
    }
    const matchPass = await user.comparePassword(password);

    if(!matchPass){
        return next(new ErrorHandler("Invalid email or password"),401);

    }
    addToken(user,200,res);
    // res.status(200).json({
    //     success:true,
    //     user
    // });
});

// logout user 

exports.logout = asyncErrors(async(req,res,next)=>{
    res.cookie("token",null,{
        expires:new Date(Date.now()),
        httpOnly:true

    });

    res.status(200).json({
        success:true,
        message:"Logged Out"
    });

});

exports.forgotPassword = asyncErrors(async(req,res,next)=>{
    const user = await User.findOne({email:req.body.email});

    if(!user){
        return next(new ErrorHandler("User not found",404));

    }

    const resetToken = user.getResetPassToken();

    await user.save({validateBeforeSave:false});
    // here we pass frontend url to send to mail 
    // but at time of deploying when both both front end and back end work on same url we make it req.protocol 

    // const resetPasswordUrl = `${req.protocol}://${req.get("host")}/password/reset/${resetToken}` ;
    const resetPasswordUrl = `${process.env.FRONTEND_URL}/password/reset/${resetToken}` ;
    const msg = `Your passwords reset  token is :- \n\n${resetPasswordUrl}\n\n`;

    try{
        await sendPasswordResetMail({
            email:user.email,
            subject: "ecommerce Password Recovery",
            msg
        });
        res.status(200).json({
            success:true,
            message:  `Email sent to ${user.email} successfully!`
        })
    }catch(err){
        user.resetPasswordToken =undefined;
        user.resetPasswordExpire=undefined;
        await user.save({validateBeforeSave:false});

        return next( new ErrorHandler(err.message,500));
    }


});

// reset forgot password 
exports.resetPassword = asyncErrors(async (req,res,next)=>{
    // hashing token to match field in user resetPassword 

    const resetPasswordToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire:{$gt:Date.now()}

    });

    if(!user){
        return next( new ErrorHandler("Reset Password Token is invalid or has been expired!",400));
    }
    if(req.body.password !==req.body.confirmPassword ){
        return next(new ErrorHandler("Passwords do not match",400));

    }
    user.password = req.body.password;
    user.resetPasswordToken=undefined;
    user.resetPasswordExpire=undefined;

    await user.save();
    addToken(user,200,res);

})

exports.getUserDetails = asyncErrors(async(req,res,next)=>{
    const user = await User.findById(req.user.id);

    res.status(200).json({
        success:true,
        user
    });
});

// update the password 
exports.updatePassword= asyncErrors(async(req,res,next)=>{
    const user = await User.findById(req.user.id).select("+password");
    
    // checking for old password 
    const checkPrevPassword = await user.comparePassword(req.body.oldPassword);
    
    if(!checkPrevPassword){
        return next(new ErrorHandler("Old password is not correct"),400);
        
    }
    
    if(req.body.newPassword !== req.body.confirmPassword){
        return next(new ErrorHandler(" password does not match"),400);
        
    }
    user.password = req.body.newPassword;
    await user.save();
    addToken(user,200,res);
    
})

// updating user profile 

exports.updateProfile = asyncErrors( async(req,res,next)=>{
    const userInfo = {
        name:req.body.name,
        email:req.body.email
    }
    

    if(req.body.avatar!==""){
        const user = await User.findById(req.user.id);

        const imageId = user.avatar.public_id;
        
        await cloudinary.v2.uploader.destroy(imageId);
        
        const myCloud  = await cloudinary.v2.uploader.upload_large(req.body.avatar,{
            folder:"avatars",
            width:150,
            crop:"scale"
        });

        userInfo.avatar ={
            public_id:myCloud.public_id,
            url:myCloud.secure_url,
        };
    }

  

    const user = await User.findByIdAndUpdate(req.user.id,{
        $set:userInfo,
    },{
        new:true,runValidators:true,useFindAndModify:false
    });

    res.status(200).json({
        success:true,

    });

});

// get all users --admin 

exports.getAllUsers = asyncErrors(async(req,res,next)=>{
    const users = await User.find();

    res.status(200).json({
        success:true,
        users
    });


});


// get a single user --admin 

exports.getUser= asyncErrors(async (req,res,next)=>{

    const user = await User.findById(req.params.id);

    if(!user){
        return next(new ErrorHandler(`User does not exist with id ${req.params.id}`));
    }

    res.status(200).json({
        success:true,
        user,
    });


})

// update User role by admin only 

exports.updateUserRole = asyncErrors(async(req,res,next)=>{

    const userInfo = {
        name: req.body.name,
        email: req.body.email,
        role: req.body.role,
      };

      await User.findByIdAndUpdate(req.params.id,{
        $set:userInfo
      },
      {
        new:true,
        runValidators:true,
        useFindAndModify:false
      });

      res.status(200).json({
        success:true,
      });
})


// delete user --admin 

exports.deleteUser = asyncErrors(async(req,res,next)=>{
    
    const user  =User.findById(req.params.id);

    
    if(!user){
        return next(new ErrorHandler(`User does not exist with id ${req.params.id}`));
    }
    if(user.avatar){
        const imageId= user.avatar.public_id;

        await cloudinary.v2.uploader.destroy(imageId);
    }

  

    await user.remove();

    res.status(200).json({
        success:true,
        message:`User with id ${req.params.id} has been deleted Successfully`
    });
});