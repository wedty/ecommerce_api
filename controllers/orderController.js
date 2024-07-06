const asyncErrors = require("../middleware/asyncErrors");
const Order= require("../models/orderModel");
const Product= require("../models/prodModel");
const ErrorHandler = require("../utils/errorClass");


exports.newOrder = asyncErrors(async(req,res,next)=>{
    const { shippingInfo,
        orderItems,paymentInfo,
        itemsPrice,taxPrice
        ,shippingPrice,totalPrice} = req.body;

        const order = await Order.create({
            shippingInfo,
        orderItems,paymentInfo,
        itemsPrice,taxPrice
        ,shippingPrice,totalPrice,
        paidAt :Date.now(),
        user:req.user._id
        });

        res.status(201).json({
            success:true,
            order
        });
});

// getting an order by its id 
exports.getOrderById = asyncErrors(async(req,res,next)=>{
    // this populate method used in case of a foreignKey 
    // when we have objectId of one model as an attribute in other model , 
    // we can populate that data with help of key 
    const order = await Order.findById(req.params.id).populate("user","name email");

    if(!order){
        return next(new ErrorHandler("order not found with Id "+req.params.id),404);

    }

    res.status(200).json({
        success:true,
        order
    });
});

// orders of user logged in 
exports.myOrders = asyncErrors( async(req,res,next)=>{
    const orders = await Order.find({user:req.user._id});
    res.status(200).json({
        success: true,
        orders,
      });
});

// get all orders --admin 

exports.getAllOrders = asyncErrors( async(req,res,next)=>{
    const orders = await Order.find();
    let totalOrdersAmount = 0;
    orders.forEach((amt)=>{
        totalOrdersAmount+=amt.totalPrice;
    });
    res.status(200).json({
        success: true,
        totalOrdersAmount,
        orders,
      });
});

// update stock func 
const updateStock  = async(prodId,quantity)=>{
    // console.log(prodId);
    const product = await Product.findById(prodId);
    
    // console.log(product);
    product.Stock -=quantity;
    
    // console.log(product.Stock);

    await product.save({validateBeforeSave:false});
}

// update Order Status and stock-- by Admin only  

exports.updateOrder = asyncErrors(async (req,res,next)=>{

    const order = await Order.findById(req.params.id);

    if(!order){
        return next(new ErrorHandler("Order not found with this id",400));

    }
    if(order.status=="Delivered"){
        return next(new ErrorHandler("Order already Delivered",400));

    }

    // changing the stock of  object  
    if(req.body.status==="Shipped"){
        order.orderItems.forEach(async (o)=>{
            await updateStock(o.product,o.quantity);
            // passing product id to update stock with product quantity in the order 
        });
    }

    order.orderStatus = req.body.status;

    if(req.body.status==="Delivered"){
        order.deliveredAt=Date.now();
    }

    await order.save({ validateBeforeSave:false});

    res.status(200).json({
        success:true,
    })

})


// delete order  
exports.deleteOrder = asyncErrors(async (req,res,next)=>{

    const order = await Order.findById(req.params.id);

    if (!order) {
        return next(new ErrorHandler("Order not found with this Id", 404));
      }

    await order.remove();

    res.status(200).json({
        success:true

    });
})