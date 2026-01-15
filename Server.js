const express = require('express')
require('dotenv').config()
const cors = require('cors')
const morgan = require('morgan')
const helmet = require('helmet')
const sequelize = require('./DB_Connection/db.con')
const userRouter = require('./routes/User.router')
const LoanRouter = require('./routes/Loan.router')
const CfRouter = require('./routes/Cf.router')
const BkpRouter = require('./routes/Bkp.router')
const app = express()
const trimMiddleware = require('./middlewares/trim.middleware')
const errorMiddleware = require('./middlewares/error.middleware')

app.use(express.json())
app.use(trimMiddleware)
app.use(cors())
app.use(helmet())
app.use(morgan('dev'))

sequelize.sync({ alter: true }).then(() => console.log("all models are synced")).catch(err => console.log(err.message))

app.use('/', userRouter)
app.use('/', LoanRouter)
app.use('/', CfRouter)
app.use('/', BkpRouter)

// Error handling middleware (should be last)
app.use(errorMiddleware)

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log('server started')
})