 const imagesQueries = require("../queries/imagesQueries");
const realmsQueries = require("../queries/realmsQuery");
const usersQueries = require("../queries/usersQueries");
const cloudinary = require("../utils/cloudinary-config");
const fs = require('fs');

module.exports = {
    uploadPostImage: async (req, res) => {
        const ownerId = req.user.id;
        const image = req.file;
        const id = req.body.id;
        console.log("Uploading image with", req.body, req.file);
        try {
            const result = await cloudinary.uploader.upload(image.path, {
                resource_type: 'auto',
            });

            console.log(result);

            imageData = ({
                id,
                ownerId,
                url: result.secure_url, // Cloudinary URL
                publicId: result.public_id,  // Store the public ID for future deletion
            });
            
            const uploadedImage = await imagesQueries.uploadImage(imageData);
            res.status(201).json({
                message: "Successfully uploaded images",
                image: uploadedImage
            });
            // Remove local file after upload
            fs.unlinkSync(image.path);
        }   
        catch(error) {
            res.status(500).json({
                error: error.message
            });
        }
    },
    uploadExistingImage: async (req, res) => {
        const ownerId = req.user.id;
        const url = req.body.url;
        const id = req.body.id;
        console.log("Uploading gif with", req.body);
        try {
            imageData = ({
                id,
                ownerId,
                url
            });
            
            const uploadedImage = await imagesQueries.uploadImage(imageData);
            res.status(201).json({
                message: "Successfully uploaded images",
                image: uploadedImage
            });
        }   
        catch(error) {
            res.status(500).json({
                error: error.message
            });
        }
    },
    deletePostImages: async (req, res) => {
        const deleteIds  = req.query.deleteIds;
        const deletePublicIds = req.query.deletePublicIds || null;

        // Convert comma-separated query parameters to arrays
        const idsArray = deleteIds.split(',');
        const publicIdsArray = deletePublicIds.split(',');
        console.log(idsArray, publicIdsArray);
        try {
            // Delete from cloudinary
            if (publicIdsArray && publicIdsArray.length > 0) {
                publicIdsArray.forEach(async (publicId) => {
                    await cloudinary.uploader.destroy(publicId)
                })
            };

            // Delete from database
            if (idsArray && idsArray.length > 0) {
                imagesQueries.deleteImagesArray(idsArray);
            };

            res.status(200).json({ 
            message: 'Images deleted successfully'
            });
        } 
        catch (error) {
            console.error('Error deleting images:', error);
            res.status(500).json({ 
                error: error.message
            });
        }
      },

    updateUserProfilePicture: async(req, res) => {
        const userId = req.user.id;
        const image = req.file;
        try {
            // Fetch current user profile picture current public id
            const currentId = await usersQueries.getUserProfilePicturePublicId(userId);

            // Upload new image
            const result = await cloudinary.uploader.upload(image.path, {
                resource_type: 'auto',
            });

            // Update user in the database with new image URL and public ID
            await usersQueries.updateUserProfilePicture(userId, result.secure_url, result.public_id);

            // Delete old image if it exists and is not the default
            if (currentId !== process.env.DEFAULT_PROFILE_PICTURE_PUBLIC_ID) {
                await cloudinary.uploader.destroy(currentId);
            }

            // Respond with success
            res.status(200).json({
                message: "Succesfully updated user profile picture",
                profilePictureUrl: result.secure_url,
            });

            // Remove local file after upload
            fs.unlinkSync(image.path);
        } 
        catch (error) {
            console.error(error);
            res.status(500).json({
                error: error.message
            })
        } 
    },
    updateRealmPicture: async(req, res) => {
        const realmId = req.params.id; 
        const image = req.file;
        try {
            // Fetch current realm picture current public id
            const currentId = await realmsQueries.getRealmPicturePublicId(realmId);

            // Upload new image
            const result = await cloudinary.uploader.upload(image.path, {
                resource_type: 'auto',
            });

            // Update realm in the database with new image URL and public ID
            await realmsQueries.updateRealmPicture(realmId, result.secure_url, result.public_id);

            // Delete old image if it exists and is not the default
            if (currentId !== process.env.DEFAULT_REALM_PICTURE_PUBLIC_ID) {
                await cloudinary.uploader.destroy(currentId);
            }

            // Respond with success
            res.status(200).json({
                message: "Succesfully updated user profile picture",
                realmPictureUrl: result.secure_url,
            });

            // Remove local file after upload
            fs.unlinkSync(image.path);
        } 
        catch (error) {
            res.status(500).json({
                error: error.message
            })
        } 
    },
    uploadSocketImage: async (req, res) => {
        const image = req.file;
        try {
            // Upload new image
            const result = await cloudinary.uploader.upload(image.path, {
                resource_type: 'auto',
            });
            // Remove local file after upload
            fs.unlinkSync(image.path);

            res.json({
                message: "Image successfully uploaded use imageUrl",
                imageUrl: result.secure_url,
            })
        }
        catch (error) {
            res.status(500).json({ 
                error: error.message 
            });
        }
    },
}