
const DELTA_API = "https://api.india.delta.exchange/v2";
const SYMBOLS = ["BTCUSD", "ETHUSD"];
const REFRESH_MS = 15000;
const STALE_MS = 30000;

const prices = {};
const priceHistory = {};
let timer = null;

function createPricePanel() {
  const dashboard = document.getElementById("dashboard");
  if (!dashboard || document.getElementById("livePrices")) return;

  const panel = document.createElement("div");
  panel.id = "livePrices";
  panel.innerHTML = `
    <style>
      #livePrices { margin-top:24px; }
      #livePrices .price-card {
        background:#091525; border:1px solid #29466d;
        border-radius:12px; padding:16px; margin:12px 0;
      }
      #livePrices .coin-name { color:#00d5ff; font-weight:bold; }
      #livePrices .big-price { font-size:25px; margin:12px 0; }
      #livePrices .price-meta { color:#aabbd3; font-size:12px; line-height:2; }
      #livePrices .live-status { color:#00df91; font-weight:bold; }
      #livePrices .stale { color:#ff5555; font-weight:bold; }
      #livePrices input {
        width:100%; padding:12px; margin:10px 0;
        background:#172943; color:white;
        border:1px solid #29466d; border-radius:8px;
      }
    </style>

    <h2>Live Market Prices</h2>
    <p id="dataStatus" class="live-status">Connecting to Delta India...</p>

    <div id="coinCards">
      ${SYMBOLS.map(symbol => `
        <div class="price-card" id="card-${symbol}">
          <div class="coin-name">${symbol}</div>
          <div class="big-price" id="last-${symbol}">Loading...</div>
          <div class="price-meta">
            MARK: <span id="mark-${symbol}">--</span><br>
            Source: Delta India<br>
            Type: LAST / MARK<br>
            Updated: <span id="time-${symbol}">--</span><br>
            Status: <span id="status-${symbol}">WAITING</span>
          </div>
        </div>
      `).join("")}
    </div>

    <h2>Price Check</h2>
    <p>તમારા Broker screen નો ભાવ અહીં નાખો.</p>
    <input id="brokerPrice" type="number" step="any"
      placeholder="Enter broker price">
    <button id="checkPriceBtn">Compare Price</button>
    <div class="price-meta" id="priceResult">
      Waiting for your broker price.
    </div>
  `;

  dashboard.appendChild(panel);

  document.getElementById("checkPriceBtn")
    .addEventListener("click", comparePrice);
}

function formatPrice(value) {
  return Number(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

async function fetchTicker(symbol) {
  const response = await fetch(
    `${DELTA_API}/tickers/${symbol}`,
    { cache: "no-store" }
  );

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data = await response.json();

  if (!data.success || !data.result) {
    throw new Error("Invalid ticker response");
  }

  const item = data.result;
  const last = Number(item.close);
  const mark = Number(item.mark_price);

  if (!Number.isFinite(last) || last <= 0) {
    throw new Error("Invalid LAST price");
  }

  const timestamp = Number(item.timestamp);
  const timeMs = timestamp
    ? (timestamp < 1000000000000 ? timestamp * 1000 : timestamp)
    : Date.now();

  prices[symbol] = {
    symbol,
    last,
    mark: Number.isFinite(mark) ? mark : null,
    time: timeMs,
    receivedAt: Date.now(),
    source: "Delta India",
    type: "LAST"
  };

  if (!priceHistory[symbol]) {
    priceHistory[symbol] = [];
  }

  priceHistory[symbol].push(last);

  if (priceHistory[symbol].length > 100) {
    priceHistory[symbol].shift();
  }

  return prices[symbol];
}

function updateCard(symbol) {
  const price = prices[symbol];
  if (!price) return;

  const age = Math.max(0, Date.now() - price.time);
  const stale = age > STALE_MS;

  document.getElementById(`last-${symbol}`).textContent =
    "$" + formatPrice(price.last);

  document.getElementById(`mark-${symbol}`).textContent =
    price.mark === null ? "Not available" : "$" + formatPrice(price.mark);

  document.getElementById(`time-${symbol}`).textContent =
    new Date(price.time).toLocaleTimeString();

  const status = document.getElementById(`status-${symbol}`);
  status.textContent = stale
    ? `STALE (${Math.floor(age / 1000)}s)`
    : "LIVE";

  status.className = stale ? "stale" : "live-status";
}

async function updateMarketData() {
  const status = document.getElementById("dataStatus");
  if (!status) return;

  let successCount = 0;

  for (const symbol of SYMBOLS) {
    try {
      await fetchTicker(symbol);
      updateCard(symbol);
      successCount++;
    } catch (error) {
      const line = document.getElementById(`status-${symbol}`);
      if (line) {
        line.textContent = "ERROR: " + error.message;
        line.className = "stale";
      }

      console.error(symbol, error);
    }
  }

  status.textContent = successCount === SYMBOLS.length
    ? "DELTA INDIA CONNECTED"
    : successCount > 0
      ? "PARTIAL DATA WARNING"
      : "CONNECTION FAILED - CHECK DIAGNOSTICS";

  status.className = successCount === SYMBOLS.length
    ? "live-status"
    : "stale";
}

function comparePrice() {
  const input = document.getElementById("brokerPrice");
  const output = document.getElementById("priceResult");
  const broker = Number(input.value);

  if (!Number.isFinite(broker) || broker <= 0) {
    output.textContent = "Please enter a valid broker price.";
    return;
  }

  const price = prices.BTCUSD;

  if (!price) {
    output.textContent = "BTCUSD price is not available yet.";
    return;
  }

  const lastDiff = Math.abs(
    (broker - price.last) / price.last * 100
  );

  const markDiff = price.mark === null
    ? null
    : Math.abs((broker - price.mark) / price.mark * 100);

  output.textContent =
    `LAST difference: ${lastDiff.toFixed(4)}% | ` +
    (markDiff === null
      ? "MARK unavailable"
      : `MARK difference: ${markDiff.toFixed(4)}%`) +
    ` | ${lastDiff <= 0.1 ? "LAST MATCH" : "LAST MISMATCH"}`;
}

function startDataEngine() {
  createPricePanel();
  updateMarketData();

  if (timer) clearInterval(timer);
  timer = setInterval(updateMarketData, REFRESH_MS);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startDataEngine);
} else {
  startDataEngine();
  }
