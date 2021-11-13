// Basic express server to run on Heroku

const express = require('express')
const app = express()

app.listen(process.env.PORT || 3000)

app.get('/', function (req, res) {
	res.send('Shitcoin monitor is online')
})
