const postsQueries = require("../queries/postsQueries");
const likesQueries = require('../queries/likesQueries');
const commentsQueries = require('../queries/commentsQueries');
const usersQueries = require("../queries/usersQueries");
const realmsQueries = require("../queries/realmsQueries");
const notificationQueries = require("../queries/notificationQueries");

module.exports = {
    getAllPosts: async (req, res) => {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const sortField = req.query.sortField || 'createdAt';
        const sortOrder = req.query.sortOrder || 'desc';
        try {
            const posts = await postsQueries.getAllPosts(page, limit, sortField, sortOrder);
            // Respond with the created post
            res.status(200).json({
                posts,
            });
        }
        catch(error) {
            res.status(500).json({
                error: error.message
            })
        }
    },
    getFeed: async (req, res) => {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const sortField = req.query.sortField || 'createdAt';
        const sortOrder = req.query.sortOrder || 'desc';

        try {
            // Get user's following user and joined realms Ids
            const followingUserIds = (await usersQueries.getUserFollowing(userId)).map(user => user.id);
            const joinedRealmIds = (await realmsQueries.getUserJoinedRealms(userId)).map(realm => realm.id);
            // Get posts from user and realm Ids
            const posts = await postsQueries.getFeed(followingUserIds, joinedRealmIds, page, limit, sortField, sortOrder);
            
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
    getPost: async (req, res) => {
        const { id } = req.params;
        try {
            const post = await postsQueries.getPost(id);
            res.status(200).json({
                post
            })
        }
        catch(error) {
            res.status(500).json({
                error: error.message
            })
        }
    },
    getPostRootComments: async (req, res) => {
        const { id } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const sortField = req.query.sortField || 'createdAt';
        const sortOrder = req.query.sortOrder || 'desc';
        try {
            const comments = await commentsQueries.getPostRootComments(id, page, limit, sortField, sortOrder);
            res.status(200).json({
                comments
            })
        }
        catch(error) {
            res.status(500).json({
                message: error.message
            })
        }
    },
    createPost: async (req, res) => {
        const { id } = req.user;
        const { realmId, title, text, published, imageIds } = req.body;

        try {
            const postData = {
                authorId: id, 
                realmId: realmId || null,
                title,
                text,
                published,
                images: {
                    connect: imageIds.map((id) => ({ id })),
                },
            }
            const post = await postsQueries.createPost(postData);

            // Respond with the created post
            res.status(201).json({
                message: "Succesfully created post",
                post
            });
        }
        catch(error) {
            res.status(500).json({
                error: error.message
            })
        }
    },
    updatePost: async (req, res) => {
        const { id } = req.params;
        const { realmId, title, text, published, imageIds } = req.body;

        try {
            // Update post data
            const updatedPostData = {
                realmId: realmId || null,
                title,
                text,
                published,
                images: {
                    connect: imageIds.map((id) => ({ id })),
                },
            };
            // Update post in the database
            const post = await postsQueries.updatePost(id, updatedPostData);

            // Respond with the updated post
            res.status(200).json({
                message: "Succesfully updated post",
                post
            });
        } catch (error) {
            res.status(500).json({
                error: error.message
            });
        }
    },
    deletePost: async (req, res) => {
        const { id } = req.params;
        try {
            const post = await postsQueries.deletePost(id);
            // Respond with the created post
            res.status(200).json({
                message: "Succesfully deleted post",
                post
            });
        }
        catch(error) {
            res.status(500).json({
                error: error.message
            })
        }
    },
    getPostLikedUsers: async (req, res) => {
        const { id } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        try {
            const users = await usersQueries.getUsersWhoLikedPost(id, page, limit);
            // Respond with the created post
            res.status(200).json({
                users
            });
        }
        catch(error) {
            res.status(500).json({
                error: error.message
            })
        }
    },
    loggedUserLike: async (req, res) => {
        const userId = req.user.id;
        const postId = req.params.id;
        try {
            const like = await likesQueries.addLike(userId, postId);
            res.status(201).json({
                message: "Succesfully liked post",
                like
            })
            // Create Notification
            notificationQueries.createPostLikeNotification(like.post.authorId,userId, postId);
        }
        catch(error) {
            res.status(500).json({
                error: error.message
            })
        }
    },
    loggedUserUnlike: async (req, res) => {
        const userId = req.user.id;
        const postId = req.params.id;
        try {
            const like = await likesQueries.removeLike(userId, postId);
            res.status(200).json({
                message: "Successfully removed like from post",
                like
            })
        }
        catch(error) {
            res.status(500).json({
                error: error.message
            })
        }
    },
    loggedUserAddComment: async (req, res) => {
        const userId = req.user.id;
        const postId = req.params.id;
        const commentContent = req.body.comment;

        try {
            // create root comment
            const comment = await commentsQueries.addRootComment(userId, postId, commentContent);
            res.status(201).json({
                message: "successfully created root comment to post",
                comment
            });
            // Create Notification
            notificationQueries.createPostCommentNotification(comment.post.authorId, userId, postId);
        }
        catch(error) {
            res.status(500).json({
                error: error.message
            })
        }
    },
    getPostCommentCount: async (req, res) => {
        const postId = req.params.id;
        try {
            const count = await commentsQueries.getPostCommentCount(postId);
            res.status(201).json({
                message: "successfully got comment count",
                count
            })
        }
        catch(error) {
            res.status(500).json({
                message: error.message
            })
        }
    }
}