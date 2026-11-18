
(function () {
  const API = "https://api.india.delta.exchange";

  async function getCandles(symbol, resolution = "5m", count = 100) {
    const seconds = {
      "1m": 60,
      "3m": 180,
      "5m": 300,
      "15m": 900,
      "1h": 3600
    };

    if (!seconds[resolution]) {
      throw new Error("Unsupported candle timeframe");
    }

    const end = Math.floor(Date.now() / 1000);
    const start = end - seconds[resolution] * count;

    const url = new URL(API + "/v2/history/candles");

    url.searchParams.set("symbol", symbol);
    url.searchParams.set("resolution", resolution);
    url.searchParams.set("start", start);
    url.searchParams.set("end", end);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("API error: " + response.status);
    }

    const data = await response.json();

    if (!data.success || !Array.isArray(data.result)) {
      throw new Error("Invalid candle data");
    }

    return data.result.map(function (candle) {
      return {
        time: Number(candle.time),
        open: Number(candle.open),
        high: Number(candle.high),
        low: Number(candle.low),
        close: Number(candle.close),
        volume: Number(candle.volume)
      };
    }).filter(function (candle) {
      return [
        candle.open,
        candle.high,
        candle.low,
        candle.close
      ].every(Number.isFinite);
    }).sort(function (a, b) {
      return a.time - b.time;
    });
  }

  window.BBPCandles = {
    getCandles: getCandles
  };

  console.log("BBP Live Candles module loaded");
})();
