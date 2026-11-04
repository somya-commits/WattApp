
const express = require("express");
const router = express.Router();

const EnergyReading = require("../models/EnergyReading");
const deviceConfig = require("../config/deviceConfig");

// ==========================================
// VALIDATE INCOMING READINGS
// ==========================================

function validateReading(data) {
  const fields = ["voltage", "current", "power", "energy"];

  return fields.every(field =>
    typeof data[field] === "number" &&
    Number.isFinite(data[field]) &&
    data[field] >= 0
  );
}

// ==========================================
// RECEIVE HARDWARE READINGS
// ==========================================

router.post("/", async (req, res) => {
  try {
    const deviceKey = req.headers["x-device-key"];

    if (
      !deviceConfig.deviceKey ||
      deviceKey !== deviceConfig.deviceKey
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid device key"
      });
    }

    if (!validateReading(req.body)) {
      return res.status(400).json({
        success: false,
        message: "Invalid reading data"
      });
    }

    const reading = await EnergyReading.create({
      deviceId: req.body.deviceId || deviceConfig.deviceId,
      voltage: req.body.voltage,
      current: req.body.current,
      power: req.body.power,
      energy: req.body.energy,
      source: "hardware"
    });

    const io = req.app.get("io");

    if (io) {
      io.emit("newReading", reading);
    }

    return res.status(201).json({
      success: true,
      message: "Hardware reading received",
      data: reading
    });

  } catch (error) {
    console.error("Hardware reading error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// ==========================================
// GET LATEST READING
// ==========================================

router.get("/latest", async (req, res) => {
  try {
    const reading = await EnergyReading.findOne()
      .sort({ timestamp: -1 })
      .lean();

    return res.json({
      success: true,
      data: reading
    });

  } catch (error) {
    console.error("Latest reading error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch latest reading"
    });
  }
});

// ==========================================
// GET READING HISTORY
// ==========================================

router.get("/history", async (req, res) => {
  try {
    const readings = await EnergyReading.find()
      .sort({ timestamp: -1 })
      .limit(100)
      .lean();

    return res.json({
      success: true,
      data: readings
    });

  } catch (error) {
    console.error("Reading history error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch reading history"
    });
  }
});

// ==========================================
// MONTHLY ENERGY HISTORY API
// GET /api/load/monthly
// GET /api/load/monthly?year=2026
// ==========================================

router.get("/monthly", async (req, res) => {
  try {
    const requestedYear = req.query.year
      ? Number(req.query.year)
      : new Date().getFullYear();

    if (
      !Number.isInteger(requestedYear) ||
      requestedYear < 2000 ||
      requestedYear > 2100
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid year"
      });
    }

    const startDate = new Date(requestedYear, 0, 1);
    const endDate = new Date(requestedYear + 1, 0, 1);

    // Fetch a baseline reading from before the requested year.
    const queryStart = new Date(requestedYear - 1, 11, 31);

    const readings = await EnergyReading.find({
      timestamp: {
        $gte: queryStart,
        $lt: endDate
      }
    })
      .sort({ timestamp: 1, _id: 1 })
      .lean();

    // Prepare all 12 months.
    const monthlyData = Array.from(
      { length: 12 },
      (_, month) => ({
        month,
        units: 0,
        bill: 0,
        daily: {}
      })
    );

    // Store the previous cumulative energy reading per device.
    const previousReadings = new Map();

    for (const reading of readings) {
      const deviceId = reading.deviceId;
      const currentEnergy = Number(reading.energy);

      if (!Number.isFinite(currentEnergy) || currentEnergy < 0) {
        continue;
      }

      const previousEnergy = previousReadings.get(deviceId);

      if (previousEnergy !== undefined) {
        let consumedUnits = 0;

        // Handle cumulative energy counter resets.
        if (currentEnergy >= previousEnergy) {
          consumedUnits = currentEnergy - previousEnergy;
        }

        const readingDate = new Date(reading.timestamp);

        // Attribute this interval's consumption to the
        // date of the newer reading.
        if (
          readingDate >= startDate &&
          readingDate < endDate
        ) {
          const month = readingDate.getMonth();
          const day = readingDate.getDate();

          const previousDailyUnits =
            monthlyData[month].daily[day] || 0;

          monthlyData[month].daily[day] =
            previousDailyUnits + consumedUnits;
        }
      }

      // Update baseline for this device.
      previousReadings.set(deviceId, currentEnergy);
    }

    // Calculate monthly totals and estimated bills.
    monthlyData.forEach(item => {
      Object.keys(item.daily).forEach(day => {
        item.daily[day] = Number(
          item.daily[day].toFixed(6)
        );
      });

      item.units = Number(
        Object.values(item.daily)
          .reduce((sum, units) => sum + units, 0)
          .toFixed(6)
      );

      item.bill = calculateMonthlyBill(item.units);
    });

    return res.json({
      success: true,
      year: requestedYear,
      data: monthlyData
    });

  } catch (error) {
    console.error("Monthly energy API error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch monthly energy data"
    });
  }
});

// ==========================================
// MONTHLY BILL CALCULATION
// ==========================================

function calculateMonthlyBill(units) {
  const slabs = [
    { upto: 100, rate: 3.5 },
    { upto: 300, rate: 5.5 },
    { upto: 500, rate: 7 },
    { upto: Infinity, rate: 8 }
  ];

  let remaining = Math.max(0, units);
  let previous = 0;
  let total = 0;

  for (const slab of slabs) {
    const slabCapacity = slab.upto - previous;

    const slabUnits = Math.min(
      remaining,
      slabCapacity
    );

    total += slabUnits * slab.rate;
    remaining -= slabUnits;
    previous = slab.upto;

    if (remaining <= 0) {
      break;
    }
  }

  return Number(total.toFixed(2));
}

// ==========================================
// EXPORT ROUTER
// ==========================================

module.exports = router;
