require('dotenv').config();

const express = require("express");
const server = express();
const mongoose = require("mongoose");
const ConnectDB = require("./config/dbConfiguration.js");
const corsPolicy = require('./config/corsConfig.js')
const cookieParser = require('cookie-parser')

ConnectDB();

const PORT = process.env.PORT || 3500;

server.use(express.json());
server.use(cookieParser())

server.use(corsPolicy);

server.use('/register', require('./routes/register.js'))
server.use('/login', require('./routes/login.js'))
server.use('/refresh', require('./routes/refresh.js'))
server.use('/logout', require('./routes/logout.js'))
server.use("/articles", require('./routes/api/articles.js'));
server.use("/users", require('./routes/users.js'));


server.get("*", (req, res) => {
  res.status(404).json({
    message: "404 not found",
  });
});

mongoose.connection.once('open', () => {
  server.listen(PORT, () => {
    console.log(`Server is listening at port ${PORT}`);
  });
  console.log("Connected to Mongo");
});
