import mongoose from 'mongoose'
import {Request, Response } from 'express'

export function mongooseTransactions(fn:Function) {
  return async function (req:Request, res:Response) {
    let result;
    await mongoose.connection.transaction(async (session:mongoose.mongo.ClientSession) => {
      result = await fn(req, res, session);
      return result;
    });
    return result;
  };
}
