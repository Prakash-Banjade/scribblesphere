require('dotenv').config();

const express = require("express");
const server = express();

const path = require('path')
const { logger, logEvents } = require('./middlewares/logger')
const errorHandler = require('./middlewares/errorHandler')
const mongoose = require("mongoose");
const ConnectDB = require("./config/dbConfiguration.js");
const corsPolicy = require('./config/corsConfig.js')
const cookieParser = require('cookie-parser')

ConnectDB();

const PORT = process.env.PORT || 3500;

server.use(express.json({limit: '50mb'}));
server.use(cookieParser())

server.use(corsPolicy);
server.use(logger)

server.get('/', (req, res) => {
  res.send(`<h1>The backend in working fine</h1>`)
})
server.use("/auth", require('./routes/auth.js'))
server.use("/articles", require('./routes/api/articles.js'));
server.use("/users", require('./routes/users.js'));

server.all('*', (req, res) => {
  res.status(404)
  if (req.accepts('html')) {
    res.sendFile(path.join(__dirname, 'views', '404.html'))
  } else if (req.accepts('json')) {
    res.json({ message: '404 Not Found' })
  } else {
    res.type('txt').send('404 Not Found')
  }
})

server.use(errorHandler)


mongoose.connection.once('open', () => {
  server.listen(PORT, () => {
    console.log(`Server is listening at port ${PORT}`);
  });
  console.log("Connected to Mongo");
});


mongoose.connection.on('error', err => {
  console.log(err)
  logEvents(`${err.no}: ${err.code}\t${err.syscall}\t${err.hostname}`, 'mongoErrLog.log')
})