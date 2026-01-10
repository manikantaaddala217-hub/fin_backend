const express = require('express')
const userRouter = express.Router()
const { loginUser, registerUser, getAllUsersExceptAdmin, getSingleUser, updateUser, deleteUser, addAreaToUser, updatePasswordByUsername ,sendOtpToUser,validateOtp} = require('../controllers/Auth.controller')


//get emthods 
userRouter.get('/all-users', getAllUsersExceptAdmin)
userRouter.get('/userById', getSingleUser)
userRouter.get('/send-otp', sendOtpToUser)    

// //post methods 
userRouter.post('/login', loginUser)
userRouter.post('/new-user', registerUser)
userRouter.post('/update-user', updateUser)
userRouter.post('/add-area', addAreaToUser)
userRouter.post('/update-password', updatePasswordByUsername)
userRouter.post('/validate-otp', validateOtp)
// //delete methods 
userRouter.delete('/delete-user', deleteUser)

module.exports = userRouter