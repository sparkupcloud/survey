const officeLocationModel = require("../models/officeLocation.model");
const moment = require("moment");
const User = require("../models/user.model");
const { generateToken, uploadProfile } = require("../utils/helper");
const { SendError, SendSuccess } = require("../utils/response");

exports.register = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;

        if (!email || !name || !password) {
            return SendError(res, 400, "All Fields are Rrequired");
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return SendError(res, 400, "User already exists");
        }

        const office = await officeLocationModel.findOne();
        if (!office) return SendError(res, 500, "Office location not configured");

        const profile = await uploadProfile(req.file);

        const user = await User.create({
            name,
            email,
            password,
            profile,
            office: office._id,
        });
        const payload = {
            user: {
                id: user._id,
                name: user.name,
                profile: profile,
                email: user.email,
            },
        };
        return SendSuccess(res, payload, "User Registered Successfully");

    } catch (error) {
        next(error);
    }
};

exports.login = async (req, res, next) => {
    try {
        const { email, password, lat, lng } = req.body;

        const user = await User.findOne({ email });
        if (!user) return SendError(res, 400, "User not registered");

        const isMatch = await user.comparePassword(password);
        if (!isMatch) return SendError(res, 400, "Invalid credentials");

        const today = moment().startOf("day");
        const lastLogin = user.lastLoginDate ? moment(user.lastLoginDate).startOf("day") : null;
        //TODO: Need to uncomment this code
        // if (!lastLogin || !today.isSame(lastLogin)) {
        //     // First login of the day requires office location
        //     if (lat == null || lng == null) {
        //         return SendError(res, 400, "Current location required for first login today");
        //     }

        //     // const office = await officeLocationModel.findOne({
        //     //     location: {
        //     //         $nearSphere: {
        //     //             $geometry: {
        //     //                 type: "Point",
        //     //                 coordinates: [lng, lat],
        //     //             },
        //     //             $maxDistance: 50,
        //     //         },
        //     //     },
        //     // });

        //     // if (!office) {
        //     //     return SendError(res, 403, "You must be inside office for today's first login");
        //     // }

        //     user.lastLoginDate = new Date();
        //     await user.save();
        // }
        const loginTime = new Date();
        const payload = {
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
            },
            token: generateToken({ _id: user._id, email: user.email }),
            loginTime
        };

        return SendSuccess(res, payload, "Login successful");
    } catch (error) {
        next(error);
    }
};

exports.getDataById = async (req, res, next) => {
    try {
        const { _id } = req.user;
        const userData = await User.findById(_id);
        if(!userData) {
            return SendError(res, 400, "User Not Found");
        }
        userData.password = undefined;
        return SendSuccess(res, userData, "User Data Fetched Successfully");
    } catch (error) {
        return next(error);
    }
};
