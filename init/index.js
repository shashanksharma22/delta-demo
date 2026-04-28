if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const geocodingClient = mbxGeocoding({ accessToken: process.env.MAP_TOKEN });

main()
.then(() => {
    console.log("Connected to database");
})
.catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/wanderlust');
}

const initDB = async () => {
  await Listing.deleteMany({});
  const enriched = [];
  for (const obj of initData.data) {
    let geometry = {
      type: 'Point',
      coordinates: [0, 0]
    };
    try {
      const response = await geocodingClient.forwardGeocode({
        query: obj.location,
        limit: 1
      }).send();
      if (response.body.features && response.body.features[0]) {
        geometry = response.body.features[0].geometry;
      }
    } catch (e) {
      console.warn(`Could not geocode location: ${obj.location}`, e.message);
    }
    enriched.push({ ...obj, owner: "69c92680d2ce23188301e31a", geometry });
  }
  await Listing.insertMany(enriched);
  console.log("Data has been initialized");
}

initDB();