const asyncErrors = require("../middleware/asyncErrors");
const { isAuthenticatedUser } = require("../middleware/auth");
const Product = require("../models/prodModel");
const ErrorHandler = require("../utils/errorClass");
const Apifeature = require("../utils/prod_selFeatures");

const cloudinary = require("cloudinary");

// const ApiFeatures = require("../utils/prod_selFeatures")
exports.createProduct=asyncErrors(async(req,res,next)=>{
    let images =[];

    if(typeof req.body.images==="string"){ // this is to check if images has a single or multiple images
        images.push(req.body.images);
    }
    else{
        images =req.body.images;
    }

    const imgLinks = [];

    for( let i =0; i<images.length ;i++){
        const result = await cloudinary.v2.uploader.upload(images[i],{
            folder:"products",
        });

        imgLinks.push({
            public_id:result.public_id,
            url:result.secure_url,
        });
    }
    req.body.images = imgLinks;

        req.body.user = req.user.id;
    const product = await Product.create(req.body);
    res.status(201).json({
        success:true,
        product
    });
});


// Get All Product (Admin)
exports.getAdminProducts = asyncErrors(async (req, res, next) => {
    const products = await Product.find();
  
    res.status(200).json({
      success: true,
      products,
    });
  });

// get all products 


exports.getAllProducts= asyncErrors(async (req,res,next)=>{


    const resPerPage = 4;
  const productsCount = await Product.countDocuments();

  const apiFeature = new Apifeature(Product.find(), req.query)
    .searchFunc()
    .filterFunc();

  let products = await apiFeature.query;

  let filterProductsCount = products.length;

  apiFeature.paginationFunc(resPerPage);

  products = await apiFeature.query.clone();

  res.status(200).json({
    success: true,
    products,
    productsCount,
    resPerPage,
    filterProductsCount,
  });
});

// Get All Product (Admin)
exports.getAdminProducts = asyncErrors(async (req, res, next) => {
  const products = await Product.find();

  res.status(200).json({
    success: true,
    products,
  });
}
)
// get single prod details 
exports.getProductDetails=asyncErrors(async (req,res,next)=>{
    
    const product = await Product.findById(req.params.id);

    if(!product){

        return next(new ErrorHandler("Product Not Found"),404);
    }

    return res.status(200).json({
        success:true,
        product
    });
}
)
// update product by admin 

exports.updateProduct= asyncErrors(async (req,res,next)=>{
    try{    
        const product = await Product.findById(req.params.id);
        // console.log(product);
        if(!product){

            return next(new ErrorHandler("Product Not Found"),404);
        }

        let images=[];

        if(typeof req.body.images==="string"){ // this is to check if images has a single or multiple images
            images.push(req.body.images);
        }
        else{
            images =req.body.images;
        }
        if(images!==undefined){
            for(let i=0; i<images.length; i++){
                await cloudinary.v2.uploader.destroy(product.images[i].public_id);

            }
            const imgLinks = [];
            for( let i =0; i<images.length ;i++){
                const result = await cloudinary.v2.uploader.upload(images[i],{
                    folder:"products",
                });
        
                imgLinks.push({
                    public_id:result.public_id,
                    url:result.secure_url,
                });
            }
            req.body.images = imgLinks;
        }
       
    
       
    
        const prod = await Product.findByIdAndUpdate(req.params.id,{
            $set:req.body
        },{
            new:true,
            runValidators:true,
            useFindAndModify:false
        });


            
        res.status(200).json({
            success:true,
            prod
        })

    }
    catch(err){
        res.status(500).json({
            success:false,
            message:err
        })
    }

}
)
// delete Product 
exports.deleteProduct = asyncErrors(async (req,res,next)=>{
    const product = await Product.findById(req.params.id);

    if(!product){

        return next(new ErrorHandler("Product Not Found"),404);
    }

    for(let i=0; i<product.images.length; i++){
        await cloudinary.v2.uploader.destroy(product.images[i].public_id);
    }
    await product.remove();
    return res.status(500).json({
        success:true,
        message:"Product has been deleted!"
    });

}
)
// module.exports = router;


// create or update review 
exports.createProductReview = asyncErrors(async(req,res,next)=>{

    const {rating,comment,productId} = req.body;

    const review={
        user:req.user._id,
        name:req.user.name,
        rating:Number(rating),
        comment
    }

    const product = await Product.findById(productId);
// console.log(req.user.toString());
// console.log(r.user.toString());
    const currReviews= product.reviews.find(
        (r)=> r.user.toString() === req.user._id.toString()
    );

    if(currReviews){
        product.reviews.forEach((r) => {
            if(r.user.toString()===req.user._id.toString()){
                r.rating= Number(rating);

                r.comment =comment

            }
        });
    }
    else{
        product.reviews.push(review);
        product.numOfReviews = product.reviews.length;
    }

    let avgRating =0;
    product.reviews.forEach((rate)=>{avgRating+=rate.rating});

    product.ratings = avgRating/product.reviews.length;

    await product.save({validateBeforeSave:false});

    res.status(200).json({
        success:true,
        product
    });
});

exports.getProductReviews = asyncErrors(async(req,res,next)=>{

    const product = await Product.findById(req.query.id);

    if(!product){
        return next( new ErrorHandler("Product Not Found",404));
    }

    res.status(200).json({
        success:true,
        reviews:product.reviews
    });
});

// delete review   --admin


exports.deleteReview = asyncErrors(async(req,res ,next)=>{
    const product = await Product.findById(req.query.productId);

    if(!product){
        return next(new ErrorHandler("product not found",400));
    }

    const reviews = product.reviews.filter(
        (rev)=> rev._id.toString() !==req.query.id.toString()
    )

    let avgRating =0;
    reviews.forEach((rate)=>avgRating+=rate);

    let ratings = 0;
    if(reviews.length){
        ratings= avgRating/reviews.length;
    }
    else{
        ratings = 0;
    }

    const numOfReviews = reviews.length;

   const updated =  await Product.findByIdAndUpdate(
        req.query.productId,{
            reviews,
            ratings,
            numOfReviews
        },
        {
            new:true,
            runValidators:true,
            useFindAndModify:false
        }
    );

    res.status(200).json({
        success:true,
        updated
    });

})