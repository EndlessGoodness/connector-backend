const express = require('express');
const commentsControllers = require('../controllers/commentsControllers');
const isAuthorized= function (req, res, next) {
    if (req.user) {
        return next();
    } else {
        return res.status(401).json({ message: 'Unauthorized' });
    }
}
const router = express.Router();


// Get all comments
router.get('/', commentsControllers.getAllComments);

// Get a specific comment by id
router.get('/:id', commentsControllers.getComment);

// Update a specific comment
router.put('/:id', isAuthorized("comment"), commentsControllers.updateCommentContent);

// Delete a specific comment
router.delete('/:id', isAuthorized("comment"), commentsControllers.deleteComment);

// Get all liked users for a comment
router.get('/:id/liked', commentsControllers.getUsersWhoLikedComment);

// Get nested comments from a single root comment
router.get('/:id/nested', commentsControllers.getNestedComments);

// Logged in user to add a nested comment by replying to a specific comment
router.post('/:id/nested', commentsControllers.addNestedComment);

// Get full recursive count for all nestedComments under a comment
router.get('/:id/nested/count', commentsControllers.countFullNestedCommentTree);

// Logged in user to like a comment
router.post('/:id/like', commentsControllers.loggedUserLikeComment);

// Logged in user to unlike a comment
router.delete('/:id/like', commentsControllers.loggedUserUnlikeComment);

module.exports = router;