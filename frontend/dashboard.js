// ==========================================
// WATTWISE - SMART ENERGY DASHBOARD
// ==========================================

// ==========================================
// INITIAL DASHBOARD DATA
// ==========================================

const S = {
  used: 142,
  budget: 200,
  units: 349,
  fixed: 50,
  rate: 7,
  power: 1.42
};

const $ = id => document.getElementById(id);

const inr = value =>
  "₹" + Number(value).toLocaleString("en-IN", {
    maximumFractionDigits: 2
  });


// ==========================================
// 1. LIVE POWER GRAPH - BACKEND CONNECTION
// ==========================================

const API_BASE = "https://wattapp-1.onrender.com";
const svg = $("lv");
let powerValues = [];

function drawGraph() {
  if (!svg) {
    console.error("SVG element #lv not found");
    return;
  }

  const left = 45;
  const right = 640;
  const top = 25;
  const bottom = 170;

  if (powerValues.length === 0) {
    svg.innerHTML = `
      <text x="200" y="100"
        fill="currentColor"
        font-size="16">
        Waiting for power readings...
      </text>
    `;
    return;
  }

  const minValue = Math.min(...powerValues);
  const maxValue = Math.max(...powerValues);
  const difference = maxValue - minValue;
  const padding = Math.max(difference * 0.3, 0.02);

  const minScale = Math.max(0, minValue - padding);
  const maxScale = maxValue + padding;
  const range = maxScale - minScale || 1;

  const points = powerValues.map((value, index) => {
    const x = powerValues.length === 1
      ? right
      : left + index * (right - left) / (powerValues.length - 1);

    const y = bottom -
      ((value - minScale) / range) * (bottom - top);

    return { x, y };
  });

  const line = points
    .map(point => `${point.x},${point.y}`)
    .join(" ");

  const circles = points.map(point => `
    <circle cx="${point.x}" cy="${point.y}" r="4" fill="#8064e9"/>
  `).join("");

  svg.innerHTML = `
    <line x1="${left}" y1="${top}" x2="${right}" y2="${top}"
      stroke="currentColor" opacity=".15" stroke-dasharray="4 4"/>

    <line x1="${left}" y1="${bottom}" x2="${right}" y2="${bottom}"
      stroke="currentColor" opacity=".15" stroke-dasharray="4 4"/>

    <text x="2" y="28" fill="currentColor" font-size="11">
      ${maxScale.toFixed(3)} kW
    </text>

    <text x="2" y="173" fill="currentColor" font-size="11">
      ${minScale.toFixed(3)} kW
    </text>

    <polyline points="${line}" fill="none" stroke="#8064e9"
      stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>

    ${circles}

    <text x="45" y="200" fill="currentColor" font-size="11">Oldest</text>
    <text x="600" y="200" fill="currentColor" font-size="11">Latest</text>
  `;
}

async function fetchLiveReading() {
  try {
    const response = await fetch(`${API_BASE}/api/load/latest`);

    if (!response.ok) {
      throw new Error("Backend HTTP error: " + response.status);
    }

    const result = await response.json();
    console.log("Backend response:", result);

    // Expected backend response: { success: true, data: {...} }
    const reading = result.data;

    if (!reading) {
      throw new Error("No reading found in response.data");
    }

    const powerWatts = Number(reading.power);
    const powerKW = powerWatts / 1000;

    if (!Number.isFinite(powerWatts) || !Number.isFinite(powerKW)) {
      throw new Error("Invalid power reading");
    }

    S.power = powerKW;
    powerValues.push(powerKW);

    // Keep only the latest 20 readings.
    if (powerValues.length > 20) {
      powerValues.shift();
    }

    if ($("kw")) {
      $("kw").textContent = powerKW.toFixed(2);
    }

    if ($("powerNow")) {
      $("powerNow").textContent = powerKW.toFixed(2);
    }

    if ($("syncTime")) {
      const timestamp = reading.timestamp
        ? new Date(reading.timestamp)
        : new Date();

      $("syncTime").textContent =
        "Updated at " + timestamp.toLocaleTimeString();
    }

    if ($("voltageNow") && reading.voltage != null) {
      $("voltageNow").textContent =
        Number(reading.voltage).toFixed(1) + " V";
    }

    if ($("currentNow") && reading.current != null) {
      $("currentNow").textContent =
        Number(reading.current).toFixed(2) + " A";
    }

    if ($("energyNow") && reading.energy != null) {
      $("energyNow").textContent =
        Number(reading.energy).toFixed(3) + " kWh";
    }

    console.log("Power in kW:", powerKW);
    console.log("Graph data:", powerValues);

    drawGraph();

    // Send the latest meter reading to the AI recommendation module.
    updateAIInput(reading);

  } catch (error) {
    console.error("Live reading error:", error);

    if (svg) {
      svg.innerHTML = `
        <text x="150" y="100" fill="red" font-size="15">
          Unable to load power readings
        </text>
      `;
    }

    if ($("syncTime")) {
      $("syncTime").textContent = "Backend connection error";
    }
  }
}

// Draw graph and start backend updates.
drawGraph();
fetchLiveReading();
setInterval(fetchLiveReading, 5000);


// ==========================================
// 2. DAILY BUDGET
// ==========================================

function updateBudget() {
  if ($("bUsed")) $("bUsed").textContent = S.used;
  if ($("bLim")) $("bLim").textContent = S.budget;

  const percentage = Math.min(100, (S.used / S.budget) * 100);

  if ($("bBar")) $("bBar").style.width = percentage + "%";

  if ($("bTxt")) {
    $("bTxt").textContent =
      percentage >= 100
        ? "Budget exceeded!"
        : Math.round(percentage) + "% used, still chill";
  }

  if ($("todayCost")) {
    $("todayCost").textContent = inr(S.used);
  }
}

updateBudget();


// ==========================================
// 3. MONTHLY BILL CALCULATOR
// ==========================================

let liveMonthlyUnits = 0;
let tariffSlabs = [
  { upto: 100, rate: 3.5 },
  { upto: 300, rate: 5.5 },
  { upto: 500, rate: 7 },
  { upto: 1000, rate: 8 }
];

function calculateBill(units) {
  let remaining = Math.max(0, Number(units) || 0);
  let previousLimit = 0;
  let energyCharge = 0;

  tariffSlabs.forEach(slab => {
    const slabUnits = Math.max(
      0,
      Math.min(remaining, slab.upto - previousLimit)
    );

    energyCharge += slabUnits * slab.rate;
    remaining -= slabUnits;
    previousLimit = slab.upto;
  });

  if (remaining > 0) {
    energyCharge += remaining * tariffSlabs[tariffSlabs.length - 1].rate;
  }

  return energyCharge;
}

function renderSlabs() {
  const container = $("slabs");
  if (!container) return;

  container.innerHTML = "";

  tariffSlabs.forEach((slab, index) => {
    const previous = index === 0 ? 0 : tariffSlabs[index - 1].upto;
    const row = document.createElement("div");
    row.className = "slab";

    row.innerHTML = `
      <span>${previous + 1}–${slab.upto}</span>
      <input type="number" min="0" step=".1"
        value="${slab.rate}" data-rate="${index}">
      <span id="slabUnits${index}">0</span>
      <b id="slabCharge${index}">₹0</b>
    `;

    container.appendChild(row);
  });

  container.querySelectorAll("[data-rate]").forEach(input => {
    input.addEventListener("input", () => {
      const index = Number(input.dataset.rate);
      tariffSlabs[index].rate = Math.max(0, Number(input.value) || 0);
      calculateAndDisplay();
    });
  });
}

function calculateAndDisplay() {
  const units = Math.max(0, Number($("uN")?.value) || 0);
  const fixed = Math.max(0, Number($("fx")?.value) || 0);

  let remaining = units;
  let previousLimit = 0;
  let total = fixed;

  tariffSlabs.forEach((slab, index) => {
    const slabUnits = Math.max(
      0,
      Math.min(remaining, slab.upto - previousLimit)
    );

    const charge = slabUnits * slab.rate;

    if ($("slabUnits" + index)) {
      $("slabUnits" + index).textContent = slabUnits.toFixed(1);
    }

    if ($("slabCharge" + index)) {
      $("slabCharge" + index).textContent = inr(charge);
    }

    total += charge;
    remaining -= slabUnits;
    previousLimit = slab.upto;
  });

  if (remaining > 0) {
    total += remaining * tariffSlabs[tariffSlabs.length - 1].rate;
  }

  if ($("tot")) $("tot").textContent = inr(total);

  if ($("bNote")) {
    $("bNote").textContent =
      "Estimated energy charge + fixed charge. Actual bills may include taxes, duties and other charges.";
  }
}

function openBill() {
  if (!$("dMonth")) return;

  $("uR").value = S.units;
  $("uN").value = S.units;
  $("fx").value = S.fixed;
  $("bR").value = S.budget;
  $("bN").value = S.budget;

  renderSlabs();
  calculateAndDisplay();
  $("dMonth").showModal();
}

if ($("openBill")) $("openBill").addEventListener("click", openBill);
if ($("cMonth")) $("cMonth").addEventListener("click", openBill);
if ($("cBudget")) $("cBudget").addEventListener("click", openBill);

if ($("uR")) {
  $("uR").addEventListener("input", () => {
    $("uN").value = $("uR").value;
    calculateAndDisplay();
  });
}

if ($("uN")) {
  $("uN").addEventListener("input", () => {
    $("uR").value = Math.min(1000, Math.max(0, Number($("uN").value) || 0));
    calculateAndDisplay();
  });
}

if ($("fx")) $("fx").addEventListener("input", calculateAndDisplay);

if ($("bR")) {
  $("bR").addEventListener("input", () => {
    $("bN").value = $("bR").value;
  });
}

if ($("bN")) {
  $("bN").addEventListener("input", () => {
    $("bR").value = $("bN").value;
  });
}

if ($("save")) {
  $("save").addEventListener("click", () => {
    S.units = Math.max(0, Number($("uN").value) || 0);
    S.fixed = Math.max(0, Number($("fx").value) || 0);
    S.budget = Math.max(1, Number($("bN").value) || 1);

    const bill = calculateBill(S.units) + S.fixed;
    if ($("mBill")) $("mBill").textContent = inr(bill);

    updateBudget();
    $("dMonth").close();
  });
}

// ==========================================
// 4. APPLIANCE SIMULATOR
// ==========================================

const appliances = [
  { name: "AC", icon: "❄️", watts: 1500 },
  { name: "Water heater", icon: "♨️", watts: 2000 },
  { name: "Washing machine", icon: "🫧", watts: 500 },
  { name: "Fridge", icon: "🧊", watts: 200 },
  { name: "Fan", icon: "🌀", watts: 75 },
  { name: "TV", icon: "📺", watts: 100 },
  { name: "Laptop", icon: "💻", watts: 65 }
];

let selectedAppliance = 0;

function renderApplianceTabs() {
  const tabs = $("sTabs");
  if (!tabs) return;

  tabs.innerHTML = "";

  appliances.forEach((app, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = app.name;

    if (index === selectedAppliance) {
      button.classList.add("active");
    }

    button.addEventListener("click", () => {
      selectedAppliance = index;
      $("sW").value = app.watts;
      $("sNm").textContent = app.name;
      $("sIc").textContent = app.icon;

      renderApplianceTabs();
      calculateSimulation();
    });

    tabs.appendChild(button);
  });
}

function calculateSimulation() {
  const watts = Math.max(0, Number($("sW")?.value) || 0);
  const hours = Math.max(0, Number($("sH")?.value) || 0);
  const days = Math.max(0, Number($("sD")?.value) || 0);

  const dailyUnits = (watts * hours) / 1000;
  const monthlyUnits = dailyUnits * days;
  const cost = calculateBill(monthlyUnits);

  if ($("sHv")) $("sHv").textContent = hours + " h";
  if ($("sDv")) $("sDv").textContent = days + " days";
  if ($("rD")) $("rD").textContent = dailyUnits.toFixed(2);
  if ($("rM")) $("rM").textContent = monthlyUnits.toFixed(2);
  if ($("rC")) $("rC").textContent = inr(cost);

  if ($("sNote")) {
    $("sNote").textContent =
      "Estimated calculation using " + watts +
      " W for " + hours + " hours daily over " +
      days + " days. Actual consumption may vary.";
  }
}

function openSimulator() {
  if (!$("dSim")) return;

  $("dSim").showModal();
  renderApplianceTabs();

  const app = appliances[selectedAppliance];
  $("sNm").textContent = app.name;
  $("sIc").textContent = app.icon;
  $("sW").value = app.watts;

  calculateSimulation();
}

// This button is optional because it is not present in the supplied HTML.
const openSimulatorButton = $("openSimulator");

if (openSimulatorButton) {
  openSimulatorButton.addEventListener("click", openSimulator);
}

document.querySelectorAll("[data-app]").forEach(item => {
  const openFromCard = () => {
    selectedAppliance = Number(item.dataset.app);
    openSimulator();
  };

  item.addEventListener("click", openFromCard);

  item.addEventListener("keydown", event => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openFromCard();
    }
  });
});

["sW", "sH", "sD"].forEach(id => {
  if ($(id)) $(id).addEventListener("input", calculateSimulation);
});


// ==========================================
// 5. MONTHLY BILL FORECAST
// ==========================================

// ==========================================
// LIVE MONTHLY BILL FORECAST
// ==========================================

const monthNames = [
  "January", "February", "March", "April",
  "May", "June", "July", "August",
  "September", "October", "November", "December"
];

let forecastData = [];
let monthlyHistory = [];

async function fetchMonthlyData() {
  try {
    const year = new Date().getFullYear();

    const response = await fetch(
      `${API_BASE}/api/load/monthly?year=${year}`
    );

    const result = await response.json();

    if (!result.success) {
      throw new Error("Monthly data unavailable");
    }

    monthlyHistory = result.data;

    // Show only months up to the current month.
    forecastData = monthlyHistory.filter(
      item => item.month <= new Date().getMonth()
    );

    renderForecast();

  } catch (error) {
    console.error("Monthly forecast error:", error);
  }
}

function renderForecast() {
  const container = $("fc");
  if (!container) return;

  container.innerHTML = "";

  const currentMonth = new Date().getMonth();

  // Find highest monthly consumption
  const values = forecastData.map(item => Number(item.units) || 0);
  const maxUnits = Math.max(...values, 1);

  forecastData.forEach(item => {
    const units = Number(item.units) || 0;

    const height = units > 0
      ? Math.max(5, (units / maxUnits) * 140)
      : 4;

    const monthBox = document.createElement("div");

    const bar = document.createElement("div");
    bar.className = "bar" + (units === 0 ? " no-data" : "");
    bar.style.height = `${height}px`;

    const amount = document.createElement("b");
    amount.textContent = units.toFixed(1);

    const label = document.createElement("small");
    label.textContent = monthNames[item.month].slice(0, 3);

    monthBox.appendChild(amount);
    monthBox.appendChild(bar);
    monthBox.appendChild(label);

    monthBox.title = `${monthNames[item.month]}: ${units.toFixed(3)} kWh`;

    monthBox.addEventListener("click", () => {
      selectedMonth = item.month;
      selectedDay = null;
      openCalendar();
    });

    container.appendChild(monthBox);
  });
}

// Initial load
fetchMonthlyData();

// Refresh monthly data periodically.
setInterval(fetchMonthlyData, 30000);


// ==========================================
// 6. DAILY USAGE CALENDAR
// ==========================================


 // ==========================================
 // 6. DAILY USAGE CALENDAR - LIVE MONGODB DATA
 // ==========================================

const months = [
  "January", "February", "March", "April",
  "May", "June", "July", "August",
  "September", "October", "November", "December"
];

let selectedMonth = new Date().getMonth();
let selectedDay = null;

// Fetch fresh monthly data before opening the calendar.
async function openCalendar() {
  if (!$("dDay")) return;

  try {
    const year = new Date().getFullYear();

    const response = await fetch(
      `${API_BASE}/api/load/monthly?year=${year}`
    );

    if (!response.ok) {
      throw new Error("HTTP error: " + response.status);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error("Monthly data unavailable");
    }

    monthlyHistory = result.data || [];

    renderCalendar();
    $("dDay").showModal();

  } catch (error) {
    console.error("Calendar loading error:", error);
    alert("Unable to load calendar data. Check your backend.");
  }
}

// Clicking the monthly bill opens the current month.
if ($("mBill")) {
  $("mBill").addEventListener("click", event => {
    event.stopPropagation();

    selectedMonth = new Date().getMonth();
    selectedDay = null;

    openCalendar();
  });
}

function renderCalendar() {
  const tabs = $("yTabs");
  const grid = $("yG");

  if (!tabs || !grid) return;

  const year = new Date().getFullYear();

  // Find selected month's MongoDB record.
  const monthData = monthlyHistory.find(
    item => Number(item.month) === selectedMonth
  );

  const daily = monthData?.daily || {};

  const monthlyUnits = Number(monthData?.units || 0);
  const monthlyBill = Number(monthData?.bill || 0);

  // ==========================================
  // MONTH TABS
  // ==========================================

  tabs.innerHTML = "";

  months.forEach((month, index) => {
    const button = document.createElement("button");

    button.type = "button";
    button.textContent = month.slice(0, 3);

    if (index === selectedMonth) {
      button.classList.add("active");
    }

    button.addEventListener("click", () => {
      selectedMonth = index;
      selectedDay = null;
      renderCalendar();
    });

    tabs.appendChild(button);
  });

  // ==========================================
  // CALENDAR GRID
  // ==========================================

  grid.innerHTML = "";

  const totalDays = new Date(
    year,
    selectedMonth + 1,
    0
  ).getDate();

  // Monday-first calendar (matches your HTML weekdays).
  const firstDay =
    (new Date(year, selectedMonth, 1).getDay() + 6) % 7;

  for (let i = 0; i < firstDay; i++) {
    const empty = document.createElement("span");
    empty.className = "calendar-empty";
    grid.appendChild(empty);
  }

  let recordedDays = 0;
  let recordedUnits = 0;

  for (let day = 1; day <= totalDays; day++) {

    const hasData = Object.prototype.hasOwnProperty.call(
      daily,
      String(day)
    );

    const units = hasData ? Number(daily[day]) : null;

    const validData = hasData && Number.isFinite(units);

    if (validData) {
      recordedDays++;
      recordedUnits += units;
    }

    const cell = document.createElement("button");

    cell.type = "button";
    cell.className = "calendar-day";

    if (validData) {
      const level =
        units < 5 ? "low" :
        units < 8 ? "medium" :
        units < 10 ? "high" : "very";

      cell.classList.add(level);
    } else {
      cell.classList.add("no-data");
    }

    if (selectedDay === day) {
      cell.classList.add("selected");
    }

    cell.innerHTML = `
      <strong>${day}</strong>
      <small>${validData ? units.toFixed(3) + " kWh" : "No data"}</small>
    `;

    cell.addEventListener("click", () => {
      selectedDay = day;

      if ($("yD")) {
        $("yD").textContent = validData
          ? `${day} ${months[selectedMonth]}: ${units.toFixed(6)} kWh recorded usage.`
          : `${day} ${months[selectedMonth]}: No data recorded.`;

      }

      renderCalendar();
    });

    grid.appendChild(cell);
  }

  // ==========================================
  // MONTHLY SUMMARY
  // ==========================================

  if ($("yU")) {
    $("yU").textContent = monthlyUnits.toFixed(6) + " kWh";
  }

  if ($("yB")) {
    $("yB").textContent = inr(monthlyBill);
  }

  if ($("yA")) {
    $("yA").textContent = recordedDays > 0
      ? (recordedUnits / recordedDays).toFixed(3) + " kWh"
      : "No data";
  }

  // Selected day information.
  if ($("yD")) {
    if (selectedDay === null) {
      $("yD").textContent =
        `${months[selectedMonth]} ${year} — Select a day to see recorded usage.`;
    }
  }
}


// ==========================================
// 7. DARK / LIGHT MODE
// ==========================================

if ($("theme")) {
  $("theme").addEventListener("click", () => {
    document.body.classList.toggle("dark");

    $("theme").textContent =
      document.body.classList.contains("dark") ? "☀" : "◐";
  });
}


// ==========================================
// 8. CLOSE DIALOGS
// ==========================================

document.querySelectorAll("[data-close]").forEach(button => {
  button.addEventListener("click", () => {
    button.closest("dialog").close();
  });
});

document.querySelectorAll("dialog").forEach(dialog => {
  dialog.addEventListener("click", event => {
    if (event.target === dialog) {
      dialog.close();
    }
  });
});


// ==========================================
// 9. INITIAL DASHBOARD VALUES
// ==========================================

if ($("mBill")) {
  $("mBill").textContent = inr(calculateBill(S.units) + S.fixed);
}

if ($("todayCost")) {
  $("todayCost").textContent = inr(S.used);
}

updateBudget();

console.log("WattWise dashboard loaded successfully!");


// ==========================================
// 10. AI ENERGY-SAVING RECOMMENDATIONS
// ==========================================

let latestAIInput = null;
let lastAIRequest = 0;
let aiRequestInProgress = false;

// Build a local date key (India/browser local time), not a UTC date.
function getLocalDateKey(period) {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return period === "daily"
    ? `${year}-${month}-${day}`
    : `${year}-${month}`;
}

// Calculate energy accumulated since the browser first saved
// a baseline for this day/month.
function getPeriodEnergy(cumulativeEnergy, period) {
  const dateKey = getLocalDateKey(period);
  const storageKey = "wattwise_" + period + "_baseline";

  let saved = null;

  try {
    saved = JSON.parse(localStorage.getItem(storageKey) || "null");
  } catch (error) {
    console.error("Could not read energy baseline:", error);
  }

  const savedBaseline = saved ? Number(saved.baseline) : NaN;

  if (
    !saved ||
    saved.dateKey !== dateKey ||
    !Number.isFinite(savedBaseline) ||
    cumulativeEnergy < savedBaseline
  ) {
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        dateKey,
        baseline: cumulativeEnergy
      })
    );

    return 0;
  }

  return Math.max(0, cumulativeEnergy - savedBaseline);
}

// Prepare AI input whenever a live meter reading arrives.
function updateAIInput(reading) {
  const cumulativeEnergy = Number(reading.energy);

  if (!Number.isFinite(cumulativeEnergy)) {
    console.warn("Meter energy value is missing or invalid.");
    return;
  }

  if (powerValues.length === 0) return;

  // Average the recent graph readings (kW), then convert to watts.
  const averagePowerKW =
    powerValues.reduce((sum, value) => sum + value, 0) /
    powerValues.length;

  latestAIInput = {
    average_power: averagePowerKW * 1000,
    daily_energy: getPeriodEnergy(cumulativeEnergy, "daily"),
    monthly_energy: getPeriodEnergy(cumulativeEnergy, "monthly"),
    target_percentage: 20
  };

  console.log("AI input:", latestAIInput);

  // Do not send a request every five seconds.
  if (
    !aiRequestInProgress &&
    Date.now() - lastAIRequest >= 60000
  ) {
    fetchAIRecommendations();
  }
}

// Send the recommendation request through the Node.js backend.
async function fetchAIRecommendations() {
  if (!latestAIInput || aiRequestInProgress) {
    if (!latestAIInput) {
      const status = $("aiStatus");
      if (status) {
        status.textContent = "Waiting for the first valid meter reading...";
      }
    }
    return;
  }

  const status = $("aiStatus");
  const list = $("recommendationList");

  if (!status || !list) {
    console.error("AI recommendation HTML section not found.");
    return;
  }

  aiRequestInProgress = true;
  status.textContent = "Analyzing your energy consumption...";

  try {
    lastAIRequest = Date.now();

    const response = await fetch(`${API_BASE}/api/recommendations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(latestAIInput)
    });

    if (!response.ok) {
      throw new Error("Recommendation API HTTP error: " + response.status);
    }

    const result = await response.json();

    if (!result.success || !Array.isArray(result.recommendations)) {
      throw new Error("Invalid recommendation API response.");
    }

    renderAIRecommendations(result.recommendations);

    status.textContent =
      "Recommendations updated using your latest meter readings.";

  } catch (error) {
    console.error("AI recommendation error:", error);
    status.textContent =
      "Unable to load recommendations. Check that both servers are running.";
  } finally {
    aiRequestInProgress = false;
  }
}

// Render recommendation cards safely using textContent.
function renderAIRecommendations(recommendations) {
  const container = $("recommendationList");
  if (!container) return;

  container.innerHTML = "";

  if (recommendations.length === 0) {
    container.textContent = "No recommendations available right now.";
    return;
  }

  recommendations.forEach(item => {
    const card = document.createElement("div");
    card.className = "ai-recommendation-card";

    const title = document.createElement("h4");
    title.textContent = item.title || "Energy-saving suggestion";

    const description = document.createElement("p");
    description.textContent =
      item.description || "No description available.";

    const details = document.createElement("div");
    details.className = "ai-recommendation-details";

    const priority = document.createElement("span");
    priority.textContent = "Priority: " + (item.priority || "Normal");

    const saving = document.createElement("span");
    const savingPercent = Number(item.estimated_saving_percent);
    saving.textContent =
      "Estimated saving: " +
      (Number.isFinite(savingPercent) ? savingPercent : 0) + "%";

    details.append(priority, saving);
    card.append(title, description, details);
    container.appendChild(card);
  });
}

// Manual refresh button.
if ($("refreshRecommendations")) {
  $("refreshRecommendations").addEventListener("click", () => {
    // Permit a manual refresh even if the last automatic request
    // was made less than 60 seconds ago.
    lastAIRequest = 0;
    fetchAIRecommendations();
  });
}

// ==========================================
// LIVE MONTHLY ELECTRICITY BILL
// ==========================================

async function updateLiveMonthlyBill() {
  try {
    const year = new Date().getFullYear();
    const month = new Date().getMonth();

    const response = await fetch(
      `${API_BASE}/api/load/monthly?year=${year}`
    );

    const result = await response.json();

    if (!result.success) {
      throw new Error("Monthly data unavailable");
    }

    const currentMonthData = result.data.find(
      item => item.month === month
    );

    liveMonthlyUnits = currentMonthData
      ? Number(currentMonthData.units) || 0
      : 0;

    // Use the same tariff rates entered in the calculator
    const fixedCharge = Math.max(
      0,
      Number($("fx")?.value) || 0
    );

    const energyCharge = calculateBill(liveMonthlyUnits);
    const totalBill = energyCharge + fixedCharge;

    // Update dashboard bill
    if ($("mBill")) {
      $("mBill").textContent = inr(totalBill);
    }

    console.log("Live monthly units:", liveMonthlyUnits);
    console.log("Live energy charge:", energyCharge);
    console.log("Live estimated bill:", totalBill);

  } catch (error) {
    console.error("Live bill error:", error);
  }
}

// Fetch immediately and refresh every 5 seconds
updateLiveMonthlyBill();
setInterval(updateLiveMonthlyBill, 5000);