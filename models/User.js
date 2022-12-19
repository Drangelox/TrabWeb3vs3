const moongoose = require('mongoose')

const User = moongoose.model('User',{
    email: String,
    password:String
})

module.exports = User