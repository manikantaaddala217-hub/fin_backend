const express=require('express')
const cors=require('cors')
const morgan=require('morgan')
const helmet=require('helmet')
const sequelize=require('./DB_Connection/db.con')
const userRouter=require('./routes/User.router')
const app=express()

app.use(express.json())
app.use(cors())
app.use(helmet())
app.use(morgan())

sequelize.sync({ alter: true }).then(()=>console.log("all models are synced")).catch(err=>console.log(err.message))

app.use('/',userRouter)

app.listen(3000,()=>{
    console.log('server started')
})