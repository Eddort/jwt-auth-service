import 'dotenv/config'
import './db'

import express from 'express'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import passport from 'passport'
import Router from './routes'
import morgan from 'morgan'
import strategy from './strategy'
import { ServiceError } from './errors'
const { SERVICE_PORT } = process.env

passport.use(strategy)

const app = express()

app.use(passport.initialize())

app.use(bodyParser.urlencoded({
	extended: true
}))
app.use(morgan('combined'))
app.use(bodyParser.json())

app.use(cookieParser())
app.use('/', Router)

app.use((err, req, res, next) => {
	if (err) {
		console.error(err);
		if (err instanceof ServiceError) {
			res.status(500).json({message: err.message})
		} else {
			res.status(500).json({message: 'Server error'})
		}
	}
})

app.listen(SERVICE_PORT, () => {
	if (__DEV__) {
		console.log("Express running");
	}
})

process.on('uncaughtException', err => console.log(err.stack));
process.on('UnhandledPromiseRejection', err => console.log(err.stack))