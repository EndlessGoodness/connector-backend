const express = require('express');
const router = express.Router();
const upload = require('../utils/multer-config');
const imagesControllers = require('../controllers/imagesController');
const isAuthorized= function (req, res, next) {
    if (req.user) {
        return next();
    } else {
        return res.status(401).json({ message: 'Unauthorized' });
    }
}

// Logged user to upload post images + generate imageId (uuid) from front-end
router.post('/', upload.single('image'), imagesControllers.uploadPostImage);

// Logged user to link existing images + generate imageId (uuid) from front-end
router.post('/existing', imagesControllers.uploadExistingImage);

// User to delete post images - take query array of publicId to delete from cloud + db
router.delete('/', imagesControllers.deletePostImages);

// Logged user to upload + update profile photo url and public id for themselves
router.put('/profile-picture', upload.single('profilePicture'), imagesControllers.updateUserProfilePicture);

// User who created realm to upload + update profile photo for realm - requires a realmId as req body
router.put('/:id/realm-picture', isAuthorized, upload.single('realmPicture'), imagesControllers.updateRealmPicture);


// Endpoint for sender user to upload images for socket
router.post('/:id/socket/upload', isAuthorized, upload.single('socketImage'), imagesControllers.uploadSocketImage);

module.exports = router;