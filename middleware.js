const Bothy = require('./models/bothy');
const Review = require('./models/review');
const { bothySchema, reviewSchema } = require('./schemas');
const ExpressError = require('./utils/ExpressError');

//Checks if the user is logged in
module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.session.returnTo = req.originalUrl;
        req.flash('error', 'You must be signed in!');
        return res.redirect('/login');
    }
    next();
};

//Validates the bothy using Joi and the schema we defined
module.exports.validateBothy = (req, res, next) => {
    const { title, district, region, description } = req.body;
    const { error } = bothySchema.validate(title, district, region, description);
    if (error) {
        const msg = error.details.map(el => el.message).join(',');
        throw new ExpressError(msg, 400);
    } else {
        next();
    }
}

//Checks if the current user is the author of a bothy they're trying to edit / delete
module.exports.isAuthor = async(req, res, next) => {
    const { id } = req.params;
    const foundBothy = await Bothy.findById(id);
    if (!foundBothy.author.equals(req.user._id)) {
        req.flash('error', 'You do not have permission to do that!');
        return res.redirect(`/bothies/${id}`);    
    }
    next();
}

//Checks if the current user is the author of a bothy they're trying to edit / delete
module.exports.isReviewAuthor = async(req, res, next) => {
    const { id, reviewId } = req.params;
    const review = await Review.findById(reviewId);
    if (!review.author.equals(req.user._id)) {
        req.flash('error', 'You do not have permission to do that!');
        return res.redirect(`/bothies/${id}`);    
    }
    next();
}

//Validate the review using Joi and the schema we defined
module.exports.validateReview = (req, res, next) => {
    const { error } = reviewSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',');
        throw new ExpressError(msg, 400);
    } else {
        next();
    }
}