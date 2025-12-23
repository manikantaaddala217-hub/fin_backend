const express=require('express')
const userRouter=express.Router()
const {loginUser,registerUser,updatePassword,updateUser,deleteUser,verifyOtp,sendOtp,addArea,getAllUsers,getSingleUser}=require('../controllers/Auth.controller')


//get methods
userRouter.get('/users',getAllUsers)
userRouter.get('/userById',getSingleUser)
userRouter.get('/send-otp',sendOtp)
 userRouter.get('/verify-otp',verifyOtp)

// //post methods 
userRouter.post('/login',loginUser)
userRouter.post('/new-user',registerUser)
// app.post('/',addArea)


// //put methods 
userRouter.put('/update-password',updatePassword)
// app.put('/',updateUser)

// //delete methods 
userRouter.delete('/delete-user',deleteUser)


module.exports=userRouter