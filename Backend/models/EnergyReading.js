const mongoose = require("mongoose");

const energyReadingSchema = new mongoose.Schema(
  {
    deviceId: {
      type: String,
      required: true
    },

    voltage: {
      type: Number,
      required: true
    },

    current: {
      type: Number,
      required: true
    },

    power: {
      type: Number,
      required: true
    },

    energy: {
      type: Number,
      required: true
    },

    source: {
      type: String,
      enum: ["simulation", "hardware"],
      required: true
    },

    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model(
  "EnergyReading",
  energyReadingSchema
);