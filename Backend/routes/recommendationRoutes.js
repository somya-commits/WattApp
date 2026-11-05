
const express = require("express");
const axios = require("axios");

const router = express.Router();

// Use local Python server during development
// Use Render URL after deployment
const ML_API_URL =
    process.env.ML_API_URL || "http://127.0.0.1:8000";

router.post("/", async (req, res) => {
    try {
        const {
            average_power,
            daily_energy,
            monthly_energy,
            target_percentage
        } = req.body;

        const response = await axios.post(
            `${ML_API_URL}/recommend`,
            {
                average_power,
                daily_energy,
                monthly_energy,
                target_percentage
            },
            { timeout: 60000 }
        );

        res.json(response.data);

    } catch (error) {
    console.error("========== AI ERROR ==========");
    console.error("Message:", error.message);
    console.error("Status:", error.response?.status);
    console.error("Response:", error.response?.data);
    console.error("URL:", error.config?.url);
    console.error("==============================");

    res.status(500).json({
        success: false,
        message: "Unable to generate recommendations",
        error: error.message
    });
}
});

module.exports = router;
