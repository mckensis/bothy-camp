const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/user');
const catchAsync = require('../utils/catchAsync');
const users = require('../controllers/users')

//Routes for /register
router.route('/register')
    //GET register page
    .get(users.renderRegisterForm)
    //POST create user
    .post(catchAsync(users.createUser));

//Routes for /login
router.route('/login')
    //GET user login
    .get(users.renderLoginForm)
    //POST user login
    .post(passport.authenticate('local', { failureFlash: true, failureRedirect: '/login', keepSessionInfo: true }), users.login);

//GET user logout
router.get('/logout', users.logout);

module.exports = router;