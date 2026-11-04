
const express = require("express");
const axios = require("axios");

const router = express.Router();

// POST /api/recommendations
router.post("/", async (req, res) => {
    try {
        const {
            average_power,
            daily_energy,
            monthly_energy,
            target_percentage
        } = req.body;

        const response = await axios.post(
            "http://127.0.0.1:8000/recommend",
            {
                average_power,
                daily_energy,
                monthly_energy,
                target_percentage
            }
        );

        res.json(response.data);

    } catch (error) {
        console.error(
            "Recommendation error:",
            error.response?.data || error.message
        );

        res.status(500).json({
            success: false,
            message: "Unable to generate recommendations"
        });
    }
});

module.exports = router;
