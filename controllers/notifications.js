const notificationQueries = require("../queries/notificationQueries");

module.exports = {
    getNotifications: async (req, res) => {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        try {
            const notifications = await notificationQueries.getNotifications(userId, page, limit);
            res.status(200).json({
                notifications
            })
        }
        catch(error) {
            res.status(500).json({
                error: error.message
            })
        }
    },
}