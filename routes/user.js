const express=require('express')
const userRouter=express.Router()
// const {registerHomes}=require('./host')
const {homePage, homeDetails, favouriteList,reserved,Postreserved, booking, postfavouriteList,postUnfavourite,submitBooking,Postbooking}=require('../controller/user')
const {hostPage}=require('../controller/host')
userRouter.get('/',homePage)
userRouter.get('/user/home-list/:homeId',homeDetails)
userRouter.get('/user/favourite_list',favouriteList)
userRouter.get('/user/reserve',reserved)//---------------------------reserved page
userRouter.post('/user/reserve/:homeId',Postreserved)
userRouter.get('/host',hostPage)

userRouter.post('/user/favourite_list',postfavouriteList)
userRouter.post('/user/unfavourite/:homeId',postUnfavourite)


userRouter.get('/user/booking/:homeId',booking)
// userRouter.post('/user/booking/:homeId',Postbooking)

userRouter.get('/user/submit_booking',submitBooking)
userRouter.post('/user/submit_booking/:homeId',Postbooking)
module.exports=userRouter;