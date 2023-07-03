/** @format */

const cors = require('cors');
const dotenv = require('dotenv');
const express = require('express');
const bodyParser = require('body-parser');
const connectDB = require('./middleware/db');
const userRouter = require('./routes/users.js');
const transactionRouter = require('./routes/transactions.js');
const { notFoundError, handleError } = require('./middleware');

connectDB();
dotenv.config();
const app = express();

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
