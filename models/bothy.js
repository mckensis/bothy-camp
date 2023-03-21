const mongoose = require('mongoose');
const Review = require('./review');
const Schema = mongoose.Schema;

const ImageSchema = new Schema({
    url: String,
    filename: String
});

ImageSchema.virtual('thumbnail').get(function() {
    return this.url.replace('/upload', '/upload/w_200');
});

ImageSchema.virtual('index').get(function() {
    return this.url.replace('/upload', '/upload/h_200');
});

const opts = { toJSON: { virtuals: true }};

const BothySchema = new Schema({
    title: {
        type: String
    },
    images: [ImageSchema],
    geometry: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },
    description: {
        type: String
    },
    district: {
        type: String
    },
    region: {
        type: String
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    reviews: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Review'
        }
    ]
}, opts );

BothySchema.virtual('properties.popUpMarkup').get(function() {
    return `
        <strong><a href='/bothies/${this._id}'>${this.title}</a></strong>
        <p>${this.district}, ${this.region}</p>`;
});

BothySchema.virtual('coordinates').get(function() {
    const lon = this.geometry.coordinates[0];
    const lat = this.geometry.coordinates[1];
    return { lat, lon };
});

//Executes when deleting a Bothy to delete Bothy reviews
BothySchema.post('findOneAndDelete', async function(bothy) {
    if (bothy) {
        await Review.deleteMany({
            _id: {
                $in: bothy.reviews
            }
        });
    }
});

module.exports = mongoose.model('Bothy', BothySchema);