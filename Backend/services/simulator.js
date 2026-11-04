const EnergyReading = require("../models/EnergyReading");
const deviceConfig = require("../config/deviceConfig");

let totalEnergy = 0;
let previousTime = Date.now();

function generateReading() {
  const voltage = 230;

  const current = Number(
    (0.3 + Math.random() * 1.7).toFixed(2)
  );

  const power = Number(
    (voltage * current).toFixed(2)
  );

  const now = Date.now();

  const elapsedHours =
    (now - previousTime) / (1000 * 60 * 60);

  totalEnergy += (power * elapsedHours) / 1000;

  previousTime = now;

  return {
    deviceId: deviceConfig.deviceId,
    voltage,
    current,
    power,
    energy: Number(totalEnergy.toFixed(6)),
    source: "simulation"
  };
}

function startSimulator(io) {
  if (deviceConfig.mode !== "SIMULATION") {
    console.log("Simulation disabled. Waiting for hardware.");
    return;
  }

  console.log("WattWise simulation started!");

  setInterval(async () => {
    try {
      const data = generateReading();

      const reading = await EnergyReading.create(data);

      io.emit("newReading", reading);

      console.log("New simulated reading:", data);

    } catch (error) {
      console.error("Simulation error:", error.message);
    }
  }, deviceConfig.simulationInterval);
}

module.exports = startSimulator;