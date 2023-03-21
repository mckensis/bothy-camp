const Bothy = require('../models/bothy');
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const { cloudinary } = require('../cloudinary');
const mapboxToken = process.env.MAPBOX_TOKEN;
const geocoder = mbxGeocoding({ accessToken: mapboxToken });

module.exports.index = async (req, res) => {
    const bothies = await Bothy.find({});
    res.render('bothies/index', { bothies });
};

module.exports.renderNewForm = (req, res) => {
    res.render('bothies/new');
};

module.exports.createBothy = async(req, res, next) => {
    let { title, district, region, lat, lon, description } = req.body.bothy;
    let geoData = undefined;

    const bothy = new Bothy({ title, district, region, description });

    if (!lat && !lon) {
        geoData = await geocoder.forwardGeocode({
            query: district,
            countries: ['GB'],
            limit: 1,
        }).send();
        bothy.geometry = geoData.body.features[0].geometry;
    } else {
        bothy.geometry = {
            type: 'Point',
            coordinates: [ Number(lon), Number(lat) ]
        };
    }
    
    bothy.author = req.user._id;
    bothy.images = req.files.map(file => ({ url: file.path, filename: file.filename }));
    await bothy.save();
    req.flash('success', 'Successfully made a new bothy!');
    res.redirect(`/bothies/${bothy._id}`);
};

module.exports.showBothy = async(req, res) => {
    const bothy = await Bothy.findById(req.params.id).populate({
        path: 'reviews',
        populate: {
            path: 'author'
        },
     }).populate('author');
        
    if (!bothy) {
        req.flash('error', 'Bothy not found!');
        return res.redirect('/bothies');
    }
    res.render('bothies/show', { bothy });
};

module.exports.renderEditForm = async(req, res) => {
    const { id } = req.params;
    const bothy = await Bothy.findById(id);

    if (!bothy) {
        req.flash('error', 'Bothy not found!');
        return res.redirect('/bothies');
    }
    res.render('bothies/edit', { bothy });
};

module.exports.editBothy = async(req, res) => {
    const { id } = req.params;
    const bothy = await Bothy.findByIdAndUpdate(id, { ...req.body.bothy });
    const images = req.files.map(file => ({ url: file.path, filename: file.filename }));
    bothy.images.push(...images);
    await bothy.save();

    //Deleting images from cloudinary and then database
    if (req.body.deleteImages) {
        for (let filename of req.body.deleteImages) {
            await cloudinary.uploader.destroy(filename);
        }
        await bothy.updateOne({
            $pull: { images: {
                filename: {
                    $in: req.body.deleteImages
            }}}
        });
    }
    req.flash('success', 'Successfully updated bothy!');
    res.redirect(`/bothies/${bothy._id}`);
};

module.exports.deleteBothy = async(req, res) => {
    const { id } = req.params;
    await Bothy.findByIdAndDelete(id);
    req.flash('success', 'Successfully deleted bothy!');
    res.redirect('/bothies');
};