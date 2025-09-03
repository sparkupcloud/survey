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
        aeps: { type: mongoose.Schema.Types.Decimal128 },
        dmt: { type: mongoose.Schema.Types.Decimal128 },
        matm: { type: mongoose.Schema.Types.Decimal128 },
        busBooking: { type: mongoose.Schema.Types.Decimal128 },
        flightBooking: { type: mongoose.Schema.Types.Decimal128 },
        hotelBooking: { type: mongoose.Schema.Types.Decimal128 }
    },
    notProvided: [{
        type: String
    }],
    expectedService: [{
        type: String
    }],
    feedback: {
        type: String
    },
    volume: {
        type: Number
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("ShopService", ShopServiceSchema);