const mongoose = require('mongoose');
const Bothy = require('../models/bothy');
const { cities, regions } = require('./regions');
const { places, descriptors } = require('./descriptions');
const { realBothies } = require('./realBothies');

const dbUrl = process.env.DB_URL || 'mongodb://127.0.0.1:27017/bothy-camp';

mongoose.connect(dbUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
    console.log('Database connected');
});

//Seed the database with real data
const seedDB = async () => {
    //Empty database
    await Bothy.deleteMany({});

    //Create a database entry for each bothy
    for (const bothy of realBothies) {
        const place = new Bothy({
            //My user ID from users database
            author: '64179037ba72d8dd2d26de17',
            district: bothy.district,
            region: bothy.region,
            title: bothy.title,
            description: bothy.description,
            geometry: {
                type: 'Point',
                coordinates: [ bothy.lon, bothy.lat ]
            }
        });
        await place.save();
    }
}

// const chooseRandom = (array) => {
//     return array[Math.floor(Math.random() * array.length)];
// };
// //Seed the database with fake data
// const seedDB = async () => {
//     //Remove all database entries
//     await Bothy.deleteMany({});

//     //Create 50 random bothy entries
//     for (let i = 0; i < 200; i++) {
//         const rand = Math.floor(Math.random() * 95);
//         const bothy = new Bothy({
//             //User ID
//             author: '640e047df79c64d641aed77d',
//             location: `${cities[rand].name}`,
//             title: `${chooseRandom(descriptors)} ${chooseRandom(places)}`,
//             description: 'A wee bothy it is very nice blah blah other information about it in here! And yes sdk sekjww gklvamka gktklhke5 dlkwlekg,fl kdlkdlfkl sls',
//             geometry: {
//                 type: 'Point',
//                 coordinates: [ cities[rand].lon, cities[rand].lat ]
//             }
//         });
//         bothy.images.push({ url: 'https://source.unsplash.com/collection/343893', filename: 'unsplash' }),
//             await bothy.save();
//     }
// };

seedDB().then(() => {
    mongoose.connection.close();
});