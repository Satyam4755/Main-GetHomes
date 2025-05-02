
const mongoose=require('mongoose');

const homeSchema=mongoose.Schema({
    // Add these two new fields to your schema:
    imagePublicId: {
        type: String
    },
    rulesPublicId: {
        type: String
    },
    image:String,
    Name:{
        type:String, 
        required:true
    },
    Type:{
        type:String, 
        required:true
    },
    Price:{
        type:Number, 
        required:true
    },
    Location:{
        type:String, 
        required:true
    },
    Description:String,
    Rating:{
        type:Number, 
        required:true
    },
    rules:String,
    host:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User'
    }
})

module.exports=mongoose.model('Home',homeSchema,'homes')//---->model name, schema name, collection name;
