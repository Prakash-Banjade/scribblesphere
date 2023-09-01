require('dotenv').config();
require('express-async-errors')
const express = require("express");
const http = require('http');
const server = express();
const httpServer = http.createServer(server);

const path = require('path')
const { logger, logEvents } = require('./utils/logger')
const errorHandler = require('./utils/errorHandler')
const mongoose = require("mongoose");
const ConnectDB = require("./config/dbConfiguration.js");
const corsPolicy = require('./config/corsConfig.js')
const cookieParser = require('cookie-parser')
const cloudinary = require('cloudinary')
const { verifySocketJWTs } = require('./middlewares/verifyJWTs')
const { sendConnectRequest, getConnectStatus, responseConnectRequest } = require('./controllers/userSocketController')


const { Server } = require("socket.io");
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:5173', 'https://scribblesphere.vercel.app']
  }
});

ConnectDB();
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const PORT = process.env.PORT || 3500;

server.use(express.json({ limit: '50mb' }));
server.use(cookieParser())

server.use(corsPolicy);
server.use(logger)

server.get('/', (req, res) => {
  res.send(`<h1>The backend in working fine</h1>`)
})
server.use("/auth", require('./routes/auth.js'))
server.use("/articles", require('./routes/api/articles.js'));
server.use("/users", require('./routes/users.js'));

// socket.io implementation
io.use(verifySocketJWTs)

io.on('connection', socket => {
  socket.join(socket.userId);

  console.log(socket.fullname + ' joined ' + socket.userId)

  socket.on('send_connect_req', (id, cb) => sendConnectRequest({ id, cb }, socket));
  socket.on('get_connect_status', (id, cb) => getConnectStatus({ id, cb }, socket))
  socket.on('response_connect_request', (connectId, action, cb) => responseConnectRequest({ connectId, action, cb }, socket))
})


server.all('*', (req, res) => {
  res.status(404)
  if (req.accepts('html')) {
    res.sendFile(path.join(__dirname, 'views', '404.html'))
  } else if (req.accepts('json')) {
    res.json({ message: `Route ${req.url} not found` })
  } else {
    res.type('txt').send('404 Not Found')
  }
})

server.use(errorHandler)


mongoose.connection.once('open', () => {
  httpServer.listen(PORT, () => {
    console.log(`Server is listening at port ${PORT}`);
  });
  console.log("Connected to Mongo");
});


mongoose.connection.on('error', err => {
  console.log(err)
  logEvents(`${err.no}: ${err.code}\t${err.syscall}\t${err.hostname}`, 'mongoErrLog.log')
})