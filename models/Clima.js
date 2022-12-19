const mongoose = require('mongoose')

const Clima = mongoose.model('Clima',{
    estado: String,
    tipoClima: String
})

module.exports = Clima