const mongoose = require('mongoose');
require('dotenv').config();

//Define the MongoDB connection URL
// const mongoURL = process.env.DB_URL_LOCAL;
const mongoURL = process.env.DB_URL_CLOUD
// const mongoURL = process.env.DB_URL;
// //Set up MongoDB connections
mongoose.connect(mongoURL); 

//Get the default connection
//Mongoose maintains a deafault connection object representing the MongoDB connections.
const db = mongoose.connection;

//Define event listerners for the database connections

db.on('connected', () => {
    console.log('Connected to MongoDB server');
})

db.on('error', (err) => {
    console.log('MongoDB connection error:', err);
});

db.on('disconnected', () => {
    console.log('MongoDB disconnected');
})

//Exprot the database connection
module.exports = db;