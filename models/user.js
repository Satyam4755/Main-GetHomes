
const mongoose=require('mongoose');
const userSchema=mongoose.Schema({
    firstName:{
        type:String,
        required:[true,'First name is required'],
        trim:true,
    },
    lastName:String,
    email:{
        type:String,
        required:[true,'Email is required'],
        trim:true,
        unique:true
    },
    password:{
        type:String,
        required:[true,'Password is required'],
    },
    userType:{
        type: String,
        enum:['guest','host'],
        default:'guest'
    },
    favourites:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Home'
    }],
    reserved:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Home'
    }],
    orders: [{
        guest: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        home: { type: mongoose.Schema.Types.ObjectId, ref: 'Home' },
        name: String,
        phone: Number,
        checkin: String,
        checkout: String,
        payment: String
      }]
})

module.exports=mongoose.model('User',userSchema,'user')//---->model name, schema name, collection name;
