require("dotenv").config();

const mongoose = require("mongoose");

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected successfully!");

    console.log(
      "Database name:",
      mongoose.connection.name
    );

    await mongoose.disconnect();

  } catch (error) {
    console.log("MongoDB connection failed:");
    console.log(error.message);

    process.exitCode = 1;
  }
}

connectDB();