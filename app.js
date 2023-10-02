const express = require("express")

const app =  express()

const router = require("./routes/router")

require("dotenv").config()

app.use("/api",router)


app.listen(5000,()=>{
    console.log('Server at 5000....')
})