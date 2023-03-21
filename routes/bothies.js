const express = require('express');
const router = express.Router();
const multer = require('multer');
const catchAsync = require('../utils/catchAsync');
const ExpressError = require('../utils/ExpressError');
const Bothy = require('../models/bothy');
const { isLoggedIn, validateBothy, isAuthor } = require('../middleware');
const bothies = require('../controllers/bothies');
const { storage } = require('../cloudinary/index');

//For image upload - multer npm package
const upload = multer({ storage });

//Routes for bothies
router.route('/')
    //GET all Bothies
    .get(catchAsync(bothies.index))
    //POST / CREATE Bothy
    .post(isLoggedIn, upload.array('image'), validateBothy, catchAsync(bothies.createBothy));

//GET new Bothy page
router.get('/new', isLoggedIn, bothies.renderNewForm);

//Routes for /:id
router.route('/:id')
    //GET Bothy
    .get(catchAsync(bothies.showBothy))
    //PUT / UPDATE Bothy
    .put(isLoggedIn, isAuthor, upload.array('image'), validateBothy, catchAsync(bothies.editBothy))
    //DELETE Bothy
    .delete(isLoggedIn, isAuthor, catchAsync(bothies.deleteBothy));

//GET / UPDATE Bothy
router.get('/:id/edit', isLoggedIn, isAuthor, catchAsync(bothies.renderEditForm));

module.exports = router;