const express = require('express');
const router = express.Router();
const usersControllers = require("../controllers/usersController");
const { validateUserUpdate } = require('../utils/validator');

const isAuthorized = function (req, res, next) {
    if (req.user) {
        return next();
    } else {
        return res.status(401).json({ message: 'Unauthorized' });
    }
}

// List all users
router.get('/', usersControllers.getAllUsers);

// Get a specific metadetails for user - num published posts, num posts liked, num posts commented, num followers, num following
router.get('/:id', usersControllers.getUser);

// Get a specific user posts including num likes + (root comments including count of nested comment)
router.get('/:id/posts', usersControllers.getUserPosts);

// Get all drafts from a user
router.get('/:id/drafts', isAuthorized, usersControllers.getUserDrafts);

// Get specific posts user liked including the Post details
router.get('/:id/liked', usersControllers.getUserLikedPosts);

// Get specific posts user commented on including the Post details
router.get('/:id/commented', usersControllers.getUserCommentedPosts);

// Get specific user followers including their User details
router.get('/:id/followers', usersControllers.getUserFollowers);

// Get specific user following including their User details
router.get('/:id/following', usersControllers.getUserFollowing);

// Get specific user joined realms
router.get('/:id/joined', usersControllers.getUserJoinedRealms);

// Update a user
router.put('/:id', isAuthorized, validateUserUpdate, usersControllers.updateUser);

// Delete a user
router.delete('/:id', isAuthorized, usersControllers.deleteUser);

// Follow a user
router.post('/:id/follow', usersControllers.loggedUserFollow);

// Unfollow a user
router.delete('/:id/follow', usersControllers.loggedUserUnfollow);

module.exports = router;