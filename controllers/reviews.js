const Bothy = require("../models/bothy");
const Review = require("../models/review");

module.exports.createReview = async(req, res) => {
    const { id } = req.params;
    const bothy = await Bothy.findById(id);
    const review = new Review(req.body.review);
    review.author = req.user._id;
    bothy.reviews.push(review);
    await review.save();
    await bothy.save();
    req.flash('success', 'Your review was posted!');
    res.redirect(`/bothies/${bothy._id}`);
};

module.exports.deleteReview = async(req, res) => {
    const { id, reviewId } = req.params;
    await Bothy.findByIdAndUpdate(id, { $pull: { reviews: reviewId }});
    await Review.findByIdAndDelete(reviewId);
    req.flash('success', 'Your review was deleted!');
    res.redirect(`/bothies/${id}`);
};