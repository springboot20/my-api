/** @format */

const bodyParser = require('body-parser');
const express = require('express');
const userRouter = require('./routes/users.js');
const transactionRouter = require('./routes/transactions.js');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { notFoundError, handleError } = require('./middleware');

const app = express();

dotenv.config();
mongoose
  .connect(process.env.MONGODB_URI, {
    dbName: process.env.DBNAME,
    user: process.env.USER,
    pass: process.env.PASS,
  })
  .then(() => {
    console.log('Mongodb connected.....');
  });

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

app.use('/api/v1/users', userRouter);
app.use('/api/v1/transactions', transactionRouter);

app.get('/', (req, res) => res.send('Hello world from home page'));

app.use(notFoundError);
app.use(handleError);

app.listen(process.env.PORT || 5000, () => {
  console.log(`Server running at port : http://localhost:${process.env.PORT}`);
});
