const postsControllers = require('../controllers/postController');
const upload = require('../utils/configs/multer-config');

const express = require('express');
const isAuthorized= ()=>{
    if(locals.user){
        return true;
    }else{
        return false;
    }
};
const router = express.Router();

// List all posts
router.get('/', postsControllers.getAllPosts);

// Get feed of posts based on following users + realms - req.query page and pageSize to paginate
router.get('/feed', postsControllers.getFeed);

// Get a specific post including realm, author, images, and post's root comments + count of nested comments
router.get('/:id', postsControllers.getPost);

// Get root comments including realm, author, images, and post's root comments + count of nested comments
router.get('/:id/comments', postsControllers.getPostRootComments);

// Get all users who liked a post
router.get('/:id/liked', postsControllers.getPostLikedUsers);

// Update a post
router.put('/:id', isAuthorized("post"), postsControllers.updatePost);

// Delete a post
router.delete('/:id', isAuthorized("post"), postsControllers.deletePost);

// Logged user to create a new post
router.post('/', postsControllers.createPost);

// Logged user to like a post
router.post('/:id/like', postsControllers.loggedUserLike);

// Logged user to unlike a post
router.delete('/:id/like', postsControllers.loggedUserUnlike);

// Logged user to add a root comment to a post (req.body.comment)
router.post('/:id/comment', postsControllers.loggedUserAddComment);

// Get comment count under a post
router.get('/:id/comments/count', postsControllers.getPostCommentCount)

module.exports = router;