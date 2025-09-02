const mongoose = require("mongoose");
const { Schema } = mongoose;

const OfficeLocationSchema = new Schema({
    locationName: { type: String, required: true },
    location: {
        type: { type: String, enum: ["Point"], required: true, default: "Point" },
        coordinates: { type: [Number], required: true }, // [lng, lat]
    },
    radiusMeter: { type: Number, default: 50 },
}, { timestamps: true });

OfficeLocationSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("OfficeLocation", OfficeLocationSchema);
