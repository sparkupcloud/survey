const DailyReport = require("../models/reporting.model");
const OfficeLocation = require("../models/officeLocation.model");
const Shop = require("../models/shop.model");
const { uploadImageToS3 } = require("../utils/helper");
const { SendError, SendSuccess } = require("../utils/response");
const ShopService = require("../models/shopService.model");


exports.startDailyReport = async (req, res, next) => {
    try {
        const { lat, lng, meterReading } = req.body;

        if (!lat || !lng || !meterReading) {
            return SendError(res, 400, "All Fields are Required");
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        const existingReport = await DailyReport.findOne({
            user: req.user._id,
            date: { $gte: today, $lt: tomorrow },
        });

        if (existingReport) {
            return SendError(res, 403, "You already have a daily report for today.");
        }

        const meterPhoto = req.file
            ? await uploadImageToS3(req.file, req.user._id, "daily-report")
            : null;

        const office = await OfficeLocation.findOne({
            location: {
                $nearSphere: {
                    $geometry: { type: "Point", coordinates: [lng, lat] },
                    $maxDistance: 50,
                },
            },
        });

        if (!office) {
            return SendError(res, 403, "You are outside the office area");
        }

        const report = await DailyReport.create({
            user: req.user._id,
            date: new Date(),
            officeStart: {
                office: office._id,
                meterPhoto,
                meterReading,
            },
            shopsVisited: [],
        });

        return SendSuccess(res, report, "Visit Started Successfully");

    } catch (err) {
        next(err);
    }
};

exports.addShopVisit = async (req, res, next) => {
    try {
        const { shopName, meterReading, lat, lng, shopAddress, shopType, ownerName, ownerContact, shopContact } = req.body;

        if (!shopName || !meterReading || !lat || !lng || !shopAddress || !shopType || !ownerName || !ownerContact) {
            return SendError(res, 400, "All fields (shopName, meterReading, lat, lng) are required.");
        }

        if (!req.files || !req.files.meterPhoto || !req.files.shopPhoto) {
            return SendError(res, 400, "Meter photo and shop photo are required.");
        }

        let shop = await Shop.findOne({ shopName });

        if (!shop) {
            const shopLocation = {
                type: "Point",
                coordinates: [lng, lat],
            };

            shop = new Shop({
                shopName,
                shopAddress,
                shopType,
                ownerName,
                ownerContact,
                shopContact,
                location: shopLocation
            });

            await shop.save();
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const dailyReport = await DailyReport.findOne({
            user: req.user._id,
            date: {
                $gte: today,
                $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
            },
        });

        if (!dailyReport) {
            return SendError(res, 404, "No active daily report found for today. Please start a report first.");
        }

        const shopVisited = dailyReport.shopsVisited.find(
            (shopVisit) => shopVisit.shop.toString() === shop._id.toString()
        );

        if (shopVisited) {
            return SendError(res, 400, "Shop visit already recorded for this shop today.");
        }

        // const [meterPhotoUrl, shopPhotoUrl] = await Promise.all([
        //     uploadImageToS3(req.files.meterPhoto[0], req.user._id, "meter-photos"),
        //     uploadImageToS3(req.files.shopPhoto[0], req.user._id, "shop-photos")
        // ]);

        const meterPhotoUrl = await uploadImageToS3(req.files.meterPhoto[0], req.user._id, "meter-photos");
        const shopPhotoUrl = await uploadImageToS3(req.files.shopPhoto[0], req.user._id, "shop-photos");

        dailyReport.shopsVisited.push({
            shop: shop._id,
            meterReading,
            meterPhoto: meterPhotoUrl,
            shopPhoto: shopPhotoUrl,
            location: {
                type: "Point",
                coordinates: [lng, lat],
            },
        });

        await dailyReport.save();

        return SendSuccess(res, dailyReport, "Shop visit added and shop registered successfully.");
    } catch (err) {
        next(err);
    }
};

exports.getTodayVisit = async (req, res, next) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const dailyReport = await DailyReport.findOne({
            user: req.user._id,
            date: {
                $gte: today,
                $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
            },
        })
            .populate('shopsVisited.shop', 'shopName shopPhoto')
            .exec();

        if (!dailyReport) {
            return SendError(res, 404, "No visit report found for today.");
        }

        return SendSuccess(res, dailyReport, "Today's visit report fetched successfully.");
    } catch (err) {
        next(err);
    }
};

exports.addShopService = async (req, res, next) => {
    try {
        const {
            shopId,
            providerName,
            serviceProvided,
            commissionCharge,
            notProvided,
            expectedService,
            feedback
        } = req.body;

        if (!shopId || !providerName || !serviceProvided || !commissionCharge) {
            return SendError(res, 400, "All required fields are not provided.");
        }

        let shop = await Shop.findById(shopId);

        if (!shop) {
            return SendError(res, 404, "Shop not found.");
        }

        const newService = new ShopService({
            shop: shopId,
            providerName,
            serviceProvided,
            commissionCharge,
            notProvided,
            expectedService,
            feedback
        });

        await newService.save();

        shop.services.push(newService._id);
        await shop.save();

        return SendSuccess(res, newService, "Service added successfully.");
    } catch (err) {
        next(err);
    }
};
