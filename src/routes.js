import express from 'express'
import Joi from 'joi'
import User, { authSchema } from './model/user'
import passport from 'passport'
import jwt from 'jsonwebtoken'
import { handleAsyncError } from './errors'
import httpProxy from 'http-proxy'

const apiProxy = httpProxy.createProxyServer();

const root = express.Router()
const $ = express.Router()

const {
	SUCESS_REDIRECT_URL = 'http://google.com',
	FAIL_REDIRECT_URL = 'http://ya.ru',
	JWT_TOKEN_EXPIRES_IN = '1h',
	ROUTE_JWT_AUTH_ACCESS = '/',
	JWT_SECRET = 'secret'
} = process.env

$.post('/register', handleAsyncError(async (req, res) => {
	if (Joi.validate(req.body, authSchema).error) {
		return res.status(401).json({ error: "Register error" })
	}
	const user = await User.getNew(req.body)
	const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: JWT_TOKEN_EXPIRES_IN })
	res.cookie('JWT', token, {
		httpOnly: true,
		sameSite: true
	});
	res.json({message: "ok", token})
}))
$.get('/test', (req, res) => res.send('ok'))
$.post('/login', handleAsyncError(async (req, res) => {
	if (Joi.validate(req.body, authSchema).error) {
		return res.status(401).json({ error: "Auth error" })
	}
	const user = await User.findUserAndCheckPswd(req.body)
	const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: JWT_TOKEN_EXPIRES_IN })
	res.cookie('JWT', token, {
		httpOnly: true,
		sameSite: true
	});
	res.json({message: "ok", token})
}))

root.use('/auth', $)

root.use(ROUTE_JWT_AUTH_ACCESS, handleAsyncError(async (req, res) => {
	passport.authenticate('jwt', { session: false }, (err, { _id }) => {
		if (_id) {
			apiProxy.web(req, res, { target: `${SUCESS_REDIRECT_URL}${req.url}`, headers: {
				'target-user': _id
			}})
		} else {
			apiProxy.web(req, res, { target: `${SUCESS_REDIRECT_URL}/auth/login` })
		}
	})(req, res);
}))

export default root