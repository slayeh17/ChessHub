const router = require("express").Router();
const { Challenge } = require("../models/challenge");
const { User } = require("../models/user");
const { checkAuth } = require("../util/auth");
const { catchAsync } = require("../util/errors");

// TO BE TESTED
// attaches user data to the route object
router.use(
    catchAsync(async (req, res, next) => {
        let userID = req.url.split("/")[1];
        let userData = await User.findById(userID);
        console.log(userData);
        if (userData) {
            req.userData = userData;
            next();
        } else {
            res.status(404).json({ success: false, error: { message: "User not found" } });
        }
    })
);

// TO BE TESTED
// get user details
router.get(
    "/:userid",
    checkAuth,
    catchAsync(async (req, res, next) => {
        let userData = req.userData;
        let { id, username, email, friends, fullName, country, location } = userData;
        let resData = { id, username, email, friends, fullName, country, location };
        return res.json({ success: true, data: resData });
    })
);

// TO BE TESTED
// update user details
router.patch(
    "/:userid",
    checkAuth,
    catchAsync(async (req, res, next) => {
        let { userid } = req.params;
        let updatedData = req.body;
        // console.log(updatedData)
        await User.findByIdAndUpdate(userid, { ...updatedData });
        let { id, username, email, fname, lname, location, country, fullName } = await User.findById(userid);
        // console.log(req.userData);
        console.log({ id, username, email, fname, lname, location, country, fullName });
        return res.json({ success: true, user: { id, username, email, fname, lname, location, country, fullName } });
    })
);

// TO BE TESTED
// delete the user
router.delete(
    "/:userid",
    checkAuth,
    catchAsync(async (req, res, next) => {
        let { userData } = req;
        await userData.deleteOne();
    })
);

// get friends of the user
router.get(
    "/:userid/friends",
    checkAuth,
    catchAsync(async (req, res, next) => {
        const friends = await req.userData.getFriends();
        return res.json({ success: true, friends });
    })
);

// TO BE TESTED
// add a friend
router.post(
    "/:userid/friends/:friendid",
    checkAuth,
    catchAsync(async (req, res, next) => {
        let { friendid } = req.params;
        let friendData = await User.findById(friendid);
        if (friendData) {
            if (friendData.friends.includes(req.userData._id)) {
                res.json({ success: false, error: { message: "User is already added as a friend" } });
            } else {
                friendData.friends.push(req.userData._id);
                await friendData.save();
                req.userData.friends.push(friendData._id);
                await req.userData.save();
                res.json({ success: true });
            }
        } else {
            res.status(404).json({ success: false, error: { message: "No user with the given username found" } });
        }
    })
);

// TODO
// remove a user from friends list
router.delete(
    "/:userid/friends/:friendid",
    checkAuth,
    catchAsync(async (req, res, next) => {
        const { friendid } = req.params;
        const { userData } = req;

        // Find the friend user to be removed
        const friendData = await User.findById(friendid);
        if (!friendData) {
            return res.status(404).json({ success: false, error: { message: "Friend user not found" } });
        }

        // Remove the friend from the user's friends list
        const friendIndex = userData.friends.indexOf(friendData._id);
        if (friendIndex === -1) {
            return res
                .status(400)
                .json({ success: false, error: { message: "Friend user not found in the friends list" } });
        }
        userData.friends.splice(friendIndex, 1);
        await userData.save();

        // Remove the user from the friend's friends list
        const userIndex = friendData.friends.indexOf(userData._id);
        if (userIndex === -1) {
            return res
                .status(400)
                .json({ success: false, error: { message: "User not found in the friend's friends list" } });
        }
        friendData.friends.splice(userIndex, 1);
        await friendData.save();

        return res.json({ success: true });
    })
);

// get current challenges of the user
router.get(
    "/:userid/challenges",
    checkAuth,
    catchAsync(async (req, res, next) => {
        let { userData } = req;
        let challenges = await Challenge.find({ challenged: userData.username });
        if (!challenges) challenges = [];
        console.log("Challenges to", username, challenges);
        res.json({ success: true, challenges: challenges });
    })
);

// TO BE TESTED
// accept or decline a challenge
// challengeID here refers to the roomID associated with the challenge
router.delete(
    "/:userid/challenges/:challengeID",
    checkAuth,
    catchAsync(async (req, res) => {
        let challengeResponse = req.query.response;
        let { challengeID } = req.params;
        if (challengeResponse === "accept") {
            let { deletedCount } = await Challenge.deleteOne({ roomID: challengeID });
            return res.json({ success: true });
        } else if (challengeResponse === "decline") {
            let { deletedCount } = await Challenge.deleteOne({ roomID: challengeID });
            return res.json({ success: true });
        } else {
            res.json({ success: false, error: { message: "Invalid query parameter" } });
        }
    })
);

// TODO
// get history of games played
router.get(
    "/:userid/games",
    checkAuth,
    catchAsync(async (req, res, next) => {
        res.send("TODO");
    })
);

// TODO
// get a particular game
router.get(
    "/:userid/games/:gameid",
    catchAsync(async (req, res, next) => {
        res.send("TODO");
    })
);

module.exports = router;
