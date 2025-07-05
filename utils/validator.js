const { body } = require('express-validator');
const userQueries = require('../queries/usersQueries');

// Validation middleware for the sign-up form
const validateUser = [
    // Validate email
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email address')
        .custom(async value => {
            // Check if email already exists in the database
            const user = await userQueries.existUser('email', value);
            if (user) {
                throw new Error('Email already in use');
            }
            return true;
        }),

    // Validate username
    body('username')
        .trim()
        .notEmpty().withMessage('Username is required')
        .isLength({ min: 3, max: 20 }).withMessage('Username must be between 3 and 20 characters long')
        .matches(/^[\w.]+$/).withMessage('Username can only contain letters, numbers, underscores, and periods, and must not have any spaces')
        .custom(async value => {
            const user = await userQueries.existUser("username", value);
            if (user) {
            throw new Error('Username already in use');
            } else {
            return true;
            }
        }),


    // Validate password
    body('password')
        .trim()
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 4 }).withMessage('Password must be at least 4 characters long'),

    // Validate confirm password
    body('confirmPassword')
        .trim()
        .notEmpty().withMessage('Confirm password is required')
        .custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('Passwords must match');
            }
            return true;
        })
];

const validateUserUpdate = [
    // Validate username
    body('username')
        .trim()
        .notEmpty().withMessage('Username is required')
        .isLength({ min: 3, max: 20 }).withMessage('Username must be between 3 and 20 characters long')
        .matches(/^[\w.]+$/).withMessage('Username can only contain letters, numbers, underscores, and periods, and must not have any spaces')
]

module.exports = { validateUser, validateUserUpdate };