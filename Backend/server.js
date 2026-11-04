require("dotenv").config();

const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const cors = require("cors");
const { Server } = require("socket.io");

const deviceConfig = require("./config/deviceConfig");
const loadRoutes = require("./routes/loadRoutes");
const startSimulator = require("./services/simulator");
const recommendationRoutes = require("./routes/recommendationRoutes");

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.set("io", io);

// Middleware
app.use(cors());
app.use(express.json());
app.use("/api/recommendations", recommendationRoutes);

// Backend health check
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "WattWise backend is running!",
    mode: deviceConfig.mode
  });
});

// Reading APIs
app.use("/api/load", loadRoutes);

// Start server
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected successfully!");

    server.listen(PORT, () => {
      console.log(`WattWise server running on port ${PORT}`);

      console.log("Current mode:", deviceConfig.mode);

      startSimulator(io);
    });

  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
}

startServer();