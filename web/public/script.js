// =============================
// Calorie Predictor — script.js
// =============================

// 1) Toggle this to true to test UI without the API live.
const MOCK = false;

// 2) API endpoints
const PROD_API = "https://ai-calorie.onrender.com/predict"; // <-- your Render URL
const DEV_API  = "http://127.0.0.1:8080/predict";

// Auto-pick based on where the page is running
const PREDICT_URL =
  location.hostname === "localhost" || location.hostname === "127.0.0.1"
    ? DEV_API
    : PROD_API;

// ---- DOM refs
const form = document.getElementById("predict-form");
const statusEl = document.getElementById("status");
const resultBox = document.getElementById("result");
const resultValue = document.getElementById("result-value");
const resetBtn = document.getElementById("reset-btn");
const submitBtn = document.getElementById("submit-btn");

// ---- helpers
function getNumber(id){ return Number(document.getElementById(id).value); }
function getText(id){ return document.getElementById(id).value; }

function validate() {
  const fields = [
    ["age", 10, 100],
    ["height", 120, 220],
    ["weight", 30, 200],
    ["duration", 1, 240],
    ["hr", 40, 220],
    ["temp", 30, 45]
  ];
  for (const [id, min, max] of fields) {
    const v = getNumber(id);
    if (Number.isNaN(v) || v < min || v > max) {
      return `Please enter a valid ${id} between ${min} and ${max}.`;
    }
  }
  if (!getText("gender")) return "Please select a gender.";
  return null;
}

function setBusy(busy) {
  submitBtn.disabled = busy;
  submitBtn.textContent = busy ? "Predicting..." : "Predict";
}

function formatCalories(x) {
  return `${x.toFixed(1)} kcal`;
}

// Fetch with timeout (ms)
async function fetchWithTimeout(url, opts = {}, timeoutMs = 20000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...opts, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

// Call API with cold-start retry for Render free tier
async function callApi(payload) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 600));
    const base = 0.05 * payload.Weight * payload.Duration;
    const hrBoost = (payload.Heart_Rate - 100) * 0.8;
    const est = Math.max(20, base + hrBoost);
    return { calories: est };
  }

  // try once; if timeout or 502/503, retry after short delay
  const attempt = async () => {
    const res = await fetchWithTimeout(PREDICT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }, 20000); // 20s to allow for cold start
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`API ${res.status}: ${text || res.statusText}`);
    }
    return res.json();
  };

  try {
    return await attempt();
  } catch (err) {
    // Retry once on likely cold-start conditions
    const msg = String(err.message || err);
    if (msg.includes("The user aborted a request.") || /(?:502|503|504)/.test(msg)) {
      statusEl.textContent = "Warming up the server… retrying…";
      await new Promise(r => setTimeout(r, 1500));
      return await attempt();
    }
    throw err;
  }
}

// ---- events
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  resultBox.hidden = true;
  statusEl.textContent = "";

  const err = validate();
  if (err) { statusEl.textContent = err; return; }

  const payload = {
    Age: getNumber("age"),
    Gender: getText("gender"),      // API accepts "male"/"female" or 0/1
    Height: getNumber("height"),
    Weight: getNumber("weight"),    // accepted by API but ignored by model
    Duration: getNumber("duration"),// accepted by API but ignored by model
    Heart_Rate: getNumber("hr"),
    Body_Temp: getNumber("temp")
  };

  try {
    setBusy(true);
    statusEl.textContent = `Sending to ${PREDICT_URL} …`;
    const data = await callApi(payload);
    resultValue.textContent = `Estimated calories: ${formatCalories(Number(data.calories))}`;
    resultBox.hidden = false;
    statusEl.textContent = "Done.";
  } catch (e) {
    console.error(e);
    statusEl.textContent = "Something went wrong. Please try again.";
  } finally {
    setBusy(false);
  }
});

resetBtn.addEventListener("click", () => {
  form.reset();
  resultBox.hidden = true;
  statusEl.textContent = "";
});
