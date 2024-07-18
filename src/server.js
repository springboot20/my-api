import cors from 'cors';
import express from 'express';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import http from 'http';

import routes from '@/routes';

import { notFoundError, handleError } from '@middleware/error/Handler';

const app = express();
const httpServer = http.createServer(app);

app.use(express.json({ limit: '16kb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '16kb' }));
app.use(bodyParser.json());

app.use(express.static('public'));

app.use(cookieParser());

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use('/api/v1/auth');
app.use('/api/v1/users');
app.use('/api/v1/transactions');

app.get('/', (req, res) => res.send('Hello world from home page'));

app.use(notFoundError);
app.use(handleError);

export { httpServer };