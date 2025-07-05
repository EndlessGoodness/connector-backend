const { validationResult } = require("express-validator");
const usersQueries = require('../queries/usersQueries');
const followsQueries = require('../queries/followsQueries');
const postsQueries = require('../queries/postsQueries');
const realmsQueries = require('../queries/realmsQueries');
const notificationQueries = require('../queries/notificationQueries');

module.exports = {
    getAllUsers: async(req, res) => {
        try {
            const users = await usersQueries.getAllUsers();
            res.render("users", { users });
        }
        catch(error) {
            res.status(500).render("error", { message: error.message });
        }
    },
    getUser: async(req, res) => {
        const { id } = req.params;
        try {
            const user = await usersQueries.getUser("id", id)
            res.render("profile", { user });
        }
        catch(error) {
            res.status(500).render("error", { message: error.message });
        }
    },
    getSuggested: async (req, res) => {
        const { id } = req.params;
        const take = parseInt(req.query.take) || 4;
        console.log("Running with id and take", id, take);
        try {
            const users = await usersQueries.getSuggestedUsers(id, take);
            const realms = await realmsQueries.getSuggestedRealms(id, take);
            res.status(200).json({
                users,
                realms
            })
        }
        catch(error) {
            res.status(500).json({
                error: error.message
            })
        }

    },
    getUserPosts: async (req, res) => {
        const { id } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const sortField = req.query.sortField || 'createdAt';
        const sortOrder = req.query.sortOrder || 'desc';
        try {
            const posts = await postsQueries.getUserPosts(id, page, limit, sortField, sortOrder);
            res.render("profile", { user: { id }, posts });
        }
        catch(error) {
            res.status(500).render("error", { message: error.message });
        }
    },
    getUserDrafts: async (req, res) => {
        const { id } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const sortField = req.query.sortField || 'createdAt';
        const sortOrder = req.query.sortOrder || 'desc';
        try {
            const drafts = await postsQueries.getUserDrafts(id, page, limit, sortField, sortOrder);
            res.render("profile", { user: { id }, drafts });
        }
        catch(error) {
            res.status(500).render("error", { message: error.message });
        }
    },
    getUserLikedPosts: async (req, res) => {
        const { id } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const sortField = req.query.sortField || 'createdAt';
        const sortOrder = req.query.sortOrder || 'desc';
        try {
            const posts = await postsQueries.getUserLikedPosts(id, page, limit, sortField, sortOrder);
            res.render("profile", { user: { id }, likedPosts: posts });
        }
        catch(error) {
            res.status(500).render("error", { message: error.message });
        }
    },
    getUserCommentedPosts: async (req, res) => {
        const { id } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const sortField = req.query.sortField || 'createdAt';
        const sortOrder = req.query.sortOrder || 'desc';
        try {
            const posts  = await postsQueries.getUserCommentedPosts(id, page, limit, sortField, sortOrder);
            res.render("profile", { user: { id }, commentedPosts: posts });
        }
        catch(error) {
            res.status(500).render("error", { message: error.message });
        }
    },
    getUserFollowers: async (req, res) => {
        const { id } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        try {
            const users = await usersQueries.getUserFollowers(id, page, limit);
            res.render("profile", { user: { id }, followers: users });
        }
        catch(error) {
            res.status(500).render("error", { message: error.message });
        }
    },
    getUserFollowing: async (req, res) => {
        const { id } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        try {
            const users = await usersQueries.getUserFollowing(id, page, limit);
            res.render("profile", { user: { id }, following: users });
        }
        catch(error) {
            res.status(500).render("error", { message: error.message });
        }
    },
    getUserJoinedRealms: async (req, res) => {
        const { id } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        try {
            const realms = await realmsQueries.getUserJoinedRealms(id, page, limit);
            res.render("profile", { user: { id }, joinedRealms: realms });
        }
        catch(error) {
            res.status(500).render("error", { message: error.message });
        }
    },
    getUserCreatedRealms: async (req, res) => {
        const { id } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        try {
            const realms = await realmsQueries.getUserCreatedRealms(id, page, limit);
            res.render("profile", { user: { id }, createdRealms: realms });
        }
        catch(error) {
            res.status(500).render("error", { message: error.message });
        }
    },
    updateUser: async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).render("error", { message: "Validation failed", errors: errors.array() });
        }
        const { id } = req.params;
        const { username, bio } = req.body;
        try {
            const existingUser = await usersQueries.existUser("username", username);
            if (existingUser && existingUser.id !== id) {
                return res.status(400).render("error", { message: "Username is already taken" });
            }
            const updatedUser = await usersQueries.updateUser(id, username, bio);
            res.redirect(`/users/${id}`); // Redirect to updated profile
        }
        catch(error) {
            res.status(500).render("error", { message: error.message });
        } 
    },
    deleteUser: async (req, res) => {
        const { id } = req.params;
        try {
            await usersQueries.deleteUser(id);
            res.redirect("/users"); // Redirect to users list after deletion
        }
        catch(error) {
            res.status(500).render("error", { message: error.message });
        }
    },
    loggedUserFollow: async (req, res) => {
        const followerId = req.user.id;
        const followingId = req.params.id;
        try{
            await followsQueries.addFollow(followerId, followingId);
            notificationQueries.createUserFollowNotification(followingId, followerId);
            res.redirect(`/users/${followingId}`); // Redirect to followed user's profile
        }
        catch(error) {
            res.status(500).render("error", { message: error.message });
        }
    },
    loggedUserUnfollow: async (req, res) => {
        const followerId = req.user.id;
        const followingId = req.params.id;
        try{
            await followsQueries.removeFollow(followerId, followingId);
            res.redirect(`/users/${followingId}`); // Redirect to unfollowed user's profile
        }
        catch(error) {
            res.status(500).render("error", { message: error.message });
        }
    }
}