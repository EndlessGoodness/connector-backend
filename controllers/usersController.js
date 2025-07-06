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
            res.status(200).json({
                users
            })
        }
        catch(error) {
            res.status(500).json({
                error: error.message
            })
        }
        
    },
    getUser: async(req, res) => {
        const { id } = req.params;
        try {
            const user = await usersQueries.getUser("id", id)
            res.status(200).json({
                user
            })
        }
        catch(error) {
            res.status(500).json({
                error: error.message
            })
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
            res.status(200).json({
                posts,
            })

        }
        catch(error) {
            res.status(500).json({
                error: error.message
            })
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
            res.status(200).json({
                posts: drafts
            })
        }
        catch(error) {
            res.status(500).json({
                error: error.message
            })
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
            res.status(200).json({
                posts,
            })

        }
        catch(error) {
            res.status(500).json({
                error: error.message
            })
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
            res.status(200).json({
                posts
            })

        }
        catch(error) {
            res.status(500).json({
                error: error.message
            })
        }
    },
    getUserFollowers: async (req, res) => {
        const { id } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        try {
            const users = await usersQueries.getUserFollowers(id, page, limit);
            res.status(200).json({
                users
            })
        }
        catch(error) {
            res.status(500).json({
                error: error.message
            })
        }
    },
    getUserFollowing: async (req, res) => {
        const { id } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        try {
            const users = await usersQueries.getUserFollowing(id, page, limit);
            res.status(200).json({
                users
            })
        }
        catch(error) {
            res.status(500).json({
                error: error.message
            })
        }
    },
    getUserJoinedRealms: async (req, res) => {
        const { id } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        try {
            const realms = await realmsQueries.getUserJoinedRealms(id, page, limit);
            res.status(200).json({
                realms
            })
        }
        catch(error) {
            res.status(500).json({
                error: error.message
            })
        }
    },
    getUserCreatedRealms: async (req, res) => {
        const { id } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        try {
            const realms = await realmsQueries.getUserCreatedRealms(id, page, limit);
            res.status(200).json({
                realms
            })
        }
        catch(error) {
            res.status(500).json({
                error: error.message
            })
        }
    },
    updateUser: async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                errors: errors.array()
            })
        }
        const { id } = req.params;
        const { username, bio } = req.body;
        try {
            // If an existing user with the same username is found, and it's not the same user return error
            const existingUser = await usersQueries.existUser("username", username);
            if (existingUser && existingUser.id !== id) {
                return res.status(400).json({
                    error: 'Username is already taken'
                });
            }

            const updatedUser = await usersQueries.updateUser(id, username, bio);
            res.status(200).json({
                message: "Succesfully updated user details",
                user: updatedUser
            })
        }
        catch(error) {
            console.error("errors caught by controller", error);
            res.status(500).json({
                error: error.message
            })
        } 
    },
    deleteUser: async (req, res) => {
        const { id } = req.params;
        try {
            const user = await usersQueries.deleteUser(id);
            res.status(200).json({
                message: "Succesfully deleted user",
                user
            })
        }
        catch(error) {
            res.status(500).json({
                error: error.message
            })
        }
    },
    loggedUserFollow: async (req, res) => {
        const followerId = req.user.id;
        const followingId = req.params.id;
        try{
            const follow = await followsQueries.addFollow(followerId, followingId);
            res.status(201).json({
                message: "Succesfully followed user",
                follow
            })
            // Create Notification
            notificationQueries.createUserFollowNotification(followingId, followerId);
        }
        catch(error) {
            res.status(500).json({
                error: error.message
            })
        }
    },
    loggedUserUnfollow: async (req, res) => {
        const followerId = req.user.id;
        const followingId = req.params.id;
        try{
            const unfollow = await followsQueries.removeFollow(followerId, followingId);
            res.status(200).json({
                message: "Succesfully unfollowed user",
                unfollow
            })
        }
        catch(error) {
            res.status(500).json({
                error: error.message
            })
        }
    }
}