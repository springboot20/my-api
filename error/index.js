const mongoose = require("mongoose")

class HTTPError extends Error {
    constructor(statusCode, message) {
        super(message)

        this.message = message
        this.statusCode = statusCode
    }
}

function errorHandler(fn) {
    return async function (req, res, next) {
        try {
            let nextCalled = false
            const result = fn(req, res, (params) => {
                nextCalled = true
                next(params)
            })

            if (!res.headersSent && !nextCalled) {
                res.json(result)
            }
        } catch (error) {
            next(error)
        }
    }
}

function withTransactions(fn) {
    return async function (req, res, next) {
        let result;
        await mongoose.connection.transaction(async session => {
            result = await fn(req, res, session)
            return result
        })
        return result
    }
}

module.exports = {
    HTTPError,
    withTransactions,
    errorHandler
}