const bcrypt = require("bcrypt");
const { validationResult } = require("express-validator");
const CommentModel = require("../models/CommentModel");
const ProfileModel = require("../models/ProfileModel");
const UserModel = require("../models/UserModel");
const Flash = require("../Utils/Flash");

exports.dashboardGetController = async (req, res, next) => {
    try {
        const profile = await ProfileModel.findOne({ user: req.user._id })
            .select("_id name profilePic")
            .populate({
                path: "posts",
                select: "_id thumbnail title",
                options: { 
                    sort: { createdAt: -1 },
                    limit:3
                 },
            })
            .populate({
                path: "bookmarks",
                select: "_id title thumbnail",
                limit: 3,
                options: { 
                    sort: { createdAt: -1 },
                    limit:3
                 },
            });

        if (profile) {
            res.render("pages/dashboard/dashboard", {
                flashMsg: Flash.getMassage(req),
                profile: profile,
                posts: profile.posts,
                bookmarks:profile.bookmarks,
            });
        } else {
            res.redirect("/dashboard/create-profile");
        }
    } catch (e) {
        next(e);
    }
};

exports.createProfileGetController = async (req, res, next) => {
    try {
        const profile = await ProfileModel.findOne({ user: req.user._id });

        if (profile) {
            return res.redirect("/dashboard/edit-profile");
        } else {
            res.render("pages/dashboard/create-profile", { flashMsg: Flash.getMassage(req), error: {} });
        }
    } catch (e) {}
};

exports.createProfilePostController = async (req, res, next) => {
    const isError = validationResult(req).formatWith((e) => e.msg);
    if (isError.isEmpty()) {
        const { title, name, bio, facebook, website, linkedin, github } = req.body;
        const createdProfile = await new ProfileModel({
            name,
            title,
            bio,
            user: req.user._id,
            profilePic: req.user.profilePic,
            links: {
                facebook: facebook || "",
                linkedin: linkedin || "",
                website: website || "",
                github: github || "",
            },
            post: [],
            bookmarks: [],
        }).save();
        if (createdProfile) {
            const userUpdate = await UserModel.findOneAndUpdate(
                { _id: req.user._id },
                {
                    $set: {
                        profile: createdProfile._id,
                    },
                },
            );
            if (userUpdate) {
                req.flash("success", "user created successfuly");
                res.redirect("/dashboard");
            }
        }
    } else {
        res.render("pages/dashboard/create-profile", { flashMsg: Flash.getMassage(req), error: isError.mapped() });
    }
};

exports.editProfileGetController = async (req, res, next) => {
    try {
        const profile = await ProfileModel.findOne({ user: req.user._id });
        if (!profile) {
            res.redirect("/dashboard/create-profile");
        } else {
            res.render("pages/dashboard/edit-profile", {
                flashMsg: Flash.getMassage(req),
                error: {},
                profile: profile,
            });
        }
    } catch (e) {
        next(e);
    }
};

exports.editProfilePostController = async (req, res, next) => {
    const inputError = validationResult(req).formatWith((e) => e.msg);
    const { name, title, bio, facebook, website, linkedin, github } = req.body;

    if (inputError.isEmpty()) {
        try {
            const updatedProfile = await ProfileModel.findOneAndUpdate(
                { user: req.user._id },
                {
                    $set: {
                        name,
                        title,
                        bio,
                        links: {
                            facebook: facebook || "",
                            website: website || "",
                            linkedin: linkedin || "",
                            github: github || "",
                        },
                    },
                },
                { new: true },
            );

            req.flash("success", "profile Updated successfuly");
            res.render("pages/dashboard/edit-profile", {
                flashMsg: Flash.getMassage(req),
                error: {},
                profile: updatedProfile,
            });
        } catch (e) {
            next(e);
        }
    } else {
        req.flash("fail", "Please check the form");
        res.render("pages/dashboard/edit-profile", {
            flashMsg: Flash.getMassage(req),
            error: inputError.mapped(),
            profile: {
                name,
                title,
                bio,
                links: {
                    facebook,
                    website,
                    linkedin,
                    github,
                },
            },
        });
    }
};

exports.allBookmarksGetController = async (req, res, next) => {
    try {
        const bookmarks = await ProfileModel.findOne({ user: req.user._id }).select("_id").populate({
            path: "bookmarks",
            select: "title _id thumbnail",
        });
        const profile = ProfileModel.findOne({ user: req.user._id }).select("name profilePic");
        // res.json(bookmarks)

        res.render("pages/dashboard/allBookmarks", {
            flashMsg: Flash.getMassage(req),
            profile,
            bookmarks,
        });
    } catch (e) {
        next(e);
    }
};

exports.allCommentGetController = async (req, res, next) => {
    try {
        const profile = await ProfileModel.findOne({ user: req.user._id }).select("posts name profilePic");
        const comments = await CommentModel.find({ post: { $in: profile.posts } })
            .populate({
                path: "user",
                select: "profilePic _id",
            })
            .populate({
                path: "post",
                select: "title thumbnail _id",
            })
            .populate({
                path: "replies.user",
                select: "username profilePic",
            });

        // return res.json(comments)

        res.render("pages/dashboard/comments", {
            flashMsg: Flash.getMassage(req),
            profile,
            comments,
        });
    } catch (e) {
        next(e);
    }
};

exports.changePasswordGetController = async (req, res, next) => {
    try {
        const profile = await ProfileModel.findOne({ user: req.user._id }).select("name profilePic");
        res.render("pages/dashboard/changePassword", {
            flashMsg: Flash.getMassage(req),
            profile,
            error: {},
            errorStr: "",
        });
    } catch (e) {
        next(e);
    }
};

exports.changePasswordPostController = async (req, res, next) => {
    try {
        const formError = validationResult(req).formatWith((e) => e.msg);
        console.log(formError);
        const profile = await ProfileModel.findOne({ user: req.user._id }).select("name profilePic");
        const { oldPassword, newPassword } = req.body;

        if (!formError.isEmpty()) {
            res.render("pages/dashboard/changePassword", {
                flashMsg: Flash.getMassage(req),
                profile,
                error: formError.mapped(),
                errorStr: "",
            });
        } else {
            const user = await UserModel.findById(req.user._id);
            const isPasswordMatched = await bcrypt.compare(oldPassword, user.password);
            console.log(isPasswordMatched);

            if (!isPasswordMatched) {
                res.render("pages/dashboard/changePassword", {
                    flashMsg: Flash.getMassage(req),
                    profile,
                    error: {},
                    errorStr: "Please Provide a correct Old Password",
                });
            } else {
                const newHashedPassword = await bcrypt.hash(newPassword, 12);
                await UserModel.findOneAndUpdate(
                    { _id: req.user._id },
                    {
                        $set: {
                            password: newHashedPassword,
                        },
                    },
                );
                req.flash("success", "Password changed Successfully");
                res.render("pages/dashboard/changePassword", {
                    flashMsg: Flash.getMassage(req),
                    profile,
                    error: {},
                    errorStr: "",
                });
            }
        }
    } catch (e) {
        next(e);
    }
};
