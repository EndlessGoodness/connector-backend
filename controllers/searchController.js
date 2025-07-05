 const searchQueries = require("../queries/searchQueries");

module.exports = {
    getSearchResults: async (req, res) => {
        const query = req.query.query;
        const type = req.query.type;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        try {
            const results = await searchQueries.getSearchResults(query, type, page, limit);
            res.status(200).json({
                results
            })
        }
        catch(error) {
            res.status(500).json({
                message: error.message
            })
        }
    }
}