const name = 'bybit'
const Server = require('./server')
const UDF = require('./udf')
const API = require('./' + name + '_api')
const udf = new UDF(new API())

new Server(udf).start()
