const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const helmet = require('helmet')
const sequelize = require('./DB_Connection/db.con')
const userRouter = require('./routes/User.router')
const LoanRouter = require('./routes/Loan.router')
const CfRouter = require('./routes/Cf.router')
const BkpRouter = require('./routes/Bkp.router')
const app = express()

app.use(express.json())
app.use(cors())
app.use(helmet())
app.use(morgan('dev'))

sequelize.sync({ alter: true }).then(() => console.log("all models are synced")).catch(err => console.log(err.message))

app.use('/', userRouter)
app.use('/', LoanRouter)
app.use('/', CfRouter)
app.use('/', BkpRouter)

app.listen(4000, () => {
    console.log('server started')
})