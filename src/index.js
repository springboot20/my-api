import 'module-alias/register'

import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'

import routes from "@/routes"

const connectDB = require('./connection/connection');
const { notFoundError, handleError } = require('./middleware/errorHandler');

dotenv.config();
connectDB();

const app = express();

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser(process.env.JWT_SECRET));
app.use(cors());

app.use('/api/v1/auth', routes.authRoute);
app.use('/api/v1/users', routes.userRoute);
app.use('/api/v1/transactions', routes.transactionRoute);

app.get('/', (req, res) => res.send('Hello world from home page'));

app.use(notFoundError);
app.use(handleError);

app.listen(process.env.PORT || 5000, () => {
  console.log(`Server running at port:http://localhost:${process.env.PORT}`);
});
