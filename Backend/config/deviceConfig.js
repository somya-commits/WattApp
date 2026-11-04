const deviceConfig = {
  mode: process.env.DEVICE_MODE || "SIMULATION",

  deviceId: "WATTWISE_001",

  simulationInterval: 5000,

  deviceKey: process.env.DEVICE_KEY
};

module.exports = deviceConfig;