const OfficeLocation = require("../models/officeLocation.model");

const seedOffice = async () => {
    const count = await OfficeLocation.countDocuments();
    if (count === 0) {
        await OfficeLocation.create({
            locationName: "Main Office",
            location: { type: "Point", coordinates: [75.87129778645809, 22.68709412203773] }, // [lng, lat]
            radiusMeter: 50,
        });
        console.log("✅ Office location seeded");
    }
};

module.exports = seedOffice;
