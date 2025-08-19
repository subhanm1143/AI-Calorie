// Toggle this to true to test UI without the API live.
const MOCK = false;

// If you deployed Cloud Run in a different region/name and didn't add a Hosting rewrite,
// you can temporarily point directly to it here (CORS must allow your domain).
// Otherwise, keep it as relative /api/predict so Firebase Hosting rewrites it.
const PREDICT_URL = "/api/predict";

const form = document.getElementById("predict-form");
const statusEl = document.getElementById("status");
const resultBox = document.getElementById("result");
const resultValue = document.getElementById("result-value");
const resetBtn = document.getElementById("reset-btn");
const submitBtn = document.getElementById("submit-btn");

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
  // simple formatting — round to 0.1
  return `${x.toFixed(1)} kcal`;
}

async function callApi(payload) {
  if (MOCK) {
    // quick fake latency + value for demoing the UI
    await new Promise(r => setTimeout(r, 600));
    const base = 0.05 * payload.Weight * payload.Duration;
    const hrBoost = (payload.Heart_Rate - 100) * 0.8;
    const est = Math.max(20, base + hrBoost);
    return { calories: est };
  }

  const res = await fetch(PREDICT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json();
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  resultBox.hidden = true;
  statusEl.textContent = "";

  const err = validate();
  if (err) { statusEl.textContent = err; return; }

  const payload = {
    Age: getNumber("age"),
    Gender: getText("gender"),
    Height: getNumber("height"),
    Weight: getNumber("weight"),
    Duration: getNumber("duration"),
    Heart_Rate: getNumber("hr"),
    Body_Temp: getNumber("temp")
  };

  try {
    setBusy(true);
    statusEl.textContent = "Sending…";
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
