const express = require('express')
const server = express()
const Binance = require('./binance_api')

const cors = require('cors')
server.use(cors())

const morgan = require('morgan')
server.use(morgan('tiny'))

const UDF = require('./udf')
const udf = new UDF(Binance)

// Common

const query = require('./query')

function handlePromise(res, next, promise) {
    promise.then(result => {
        res.send(result)
    }).catch(err => {
        next(err)
    })
}

// Endpoints

server.all('/', (req, res) => {
    res.set('Content-Type', 'text/plain').send('Welcome to the server UDF Adapter for TradingView. See ./config for more details.')
})

server.get('/time', (req, res) => {
    const time = Math.floor(Date.now() / 1000)  // In seconds
    res.set('Content-Type', 'text/plain').send(time.toString())
})

server.get('/config', (req, res, next) => {
    handlePromise(res, next, udf.config())
})

server.get('/symbol_info', (req, res, next) => {
    handlePromise(res, next, udf.symbolInfo())
})

server.get('/symbols', [query.symbol], (req, res, next) => {
    handlePromise(res, next, udf.symbol(req.query.symbol))
})

server.get('/search', [query.query, query.limit], (req, res, next) => {
    if (req.query.type === '') {
        req.query.type = null
    }
    if (req.query.exchange === '') {
        req.query.exchange = null
    }

    handlePromise(res, next, udf.search(
        req.query.query,
        req.query.type,
        req.query.exchange,
        req.query.limit
    ))
})

server.get('/history', [
    query.symbol,
    query.from,
    query.to,
    query.resolution
], (req, res, next) => {
    handlePromise(res, next, udf.history(
        req.query.symbol,
        req.query.from,
        req.query.to,
        req.query.resolution
    ))
})

// Handle errors

server.use((err, req, res, next) => {
    if (err instanceof query.Error) {
        return res.status(err.status).send({
            s: 'error',
            errmsg: err.message
        })
    }

    if (err instanceof UDF.SymbolNotFound) {
        return res.status(404).send({
            s: 'error',
            errmsg: 'Symbol Not Found'
        })
    }
    if (err instanceof UDF.InvalidResolution) {
        return res.status(400).send({
            s: 'error',
            errmsg: 'Invalid Resolution'
        })
    }

    console.error(err)
    res.status(500).send({
        s: 'error',
        errmsg: 'Internal Error'
    })
})

// Listen

const port = process.env.PORT || 80
server.listen(port, () => {
    console.log(`Listening on port ${port}`)
})
