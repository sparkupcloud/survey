const mongoose = require("mongoose");

const ShopSchema = new mongoose.Schema({
    shopName: {
        type: String,
        required: true
    },
    shopAddress: {
        type: String,
        required: true
    },
    shopType: {
        type: String
    },
    ownerName: {
        type: String,
        required: true,
    },
    ownerContact: {
        type: String,
        required: true
    },
    shopContact: {
        type: String
    },
    location: {
        type: {
            type: String,
            enum: ["Point"],
            default: "Point"
        },
        coordinates: {
            type: [Number]
        }
    }
}, {
    timestamps: true
});

ShopSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Shop", ShopSchema);