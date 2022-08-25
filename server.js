const express = require("express");
const app = express();
const mongoose = require('mongoose');
const { prototype } = require("nodemailer/lib/stream-transport");

const routes = require('./routes');







app.use(express.urlencoded({ extended: false }))



app.use(express.static("public"))
app.use('/', routes);




app.set('view engine', 'ejs')
app.set('views', 'views');











app.listen(process.env.PORT || 3000);