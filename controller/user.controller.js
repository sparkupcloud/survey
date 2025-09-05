const officeLocationModel = require("../models/officeLocation.model");
const moment = require("moment");
const User = require("../models/user.model");
const { generateToken, uploadProfile } = require("../utils/helper");
const { SendError, SendSuccess } = require("../utils/response");
const Attendance = require("../models/attendance.model");

exports.login = async (req, res, next) => {
    try {
        const { email, password, lat, lng } = req.body;
        const clientIp = (req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress || '').replace(/^::ffff:/, '');

        if (lat == null || lng == null) {
            return SendError(res, 400, "Current location required for login");
        }


        const user = await User.findOne({ email });
        if (!user) return SendError(res, 400, "User not registered");

        const isMatch = await user.comparePassword(password);
        if (!isMatch) return SendError(res, 400, "Invalid credentials");

        const office = await officeLocationModel.findOne({
            location: {
                $nearSphere: {
                    $geometry: {
                        type: "Point",
                        coordinates: [lng, lat],
                    },
                    $maxDistance: 50,
                },
            },
        });

        if (!user.allowedFromOutSideOffice) {
            if (!office) {
                return SendError(res, 403, "You must be inside office for  login (location check failed)");
            }
            if (office.wifiIp?.trim() !== clientIp.trim()) {
                return SendError(res, 403, "You must be inside office for login (IP check failed)");
            }
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const attendance = await Attendance.findOneAndUpdate(
            { userId: user._id, date: today },
            {
                $push: {
                    sessions: {
                        loginTime: new Date(),
                        officeWifiIP: clientIp,
                        location: {
                            type: "Point",
                            coordinates: [lng, lat]
                        }
                    }
                }
            },
            {
                upsert: true,
                new: true,
                setDefaultsOnInsert: true
            }
        );

        const payload = {
            token: generateToken({ _id: user._id, email: user.email, role: user.role }),
            attendance
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
        if (!userData) {
            return SendError(res, 400, "User Not Found");
        }
        userData.password = undefined;
        return SendSuccess(res, userData, "User Data Fetched Successfully");
    } catch (error) {
        return next(error);
    }
};

exports.logout = async (req, res, next) => {
    try {
        const { _id } = req.user;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const attendance = await Attendance.findOne({ userId: _id, date: today });

        if (!attendance || !attendance.sessions.length) {
            return SendError(res, 404, "No login record found for today");
        }

        const sessions = attendance.sessions;
        const lastIndex = sessions.length - 1;
        const lastSession = sessions[lastIndex];

        // Ensure only the last session is allowed to be logged out
        if (lastSession.logoutTime) {
            return SendError(res, 400, "session already logged out");
        }

        lastSession.logoutTime = new Date();

        await attendance.save();

        return SendSuccess(res, attendance, "Logout successful");

    } catch (error) {
        next(error);
    }
};

