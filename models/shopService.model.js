const mongoose = require("mongoose");

const ShopServiceSchema = new mongoose.Schema({
    shop: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Shop",
        required: true
    },
    providerName: {
        type: String,
        required: true
    },
    serviceProvided: [{
        type: String
    }],
    commissionCharge: {
        aeps: { type: Number },
        dmt: { type: Number },
        matm: { type: Number },
        busBooking: { type: Number },
        flightBooking: { type: Number },
        hotelBooking: { type: Number }
    },
    notProvided: [{
        type: String
    }],
    expectedService: [{
        type: String
    }],
    feedback: {
        type: String
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("ShopService", ShopServiceSchema);