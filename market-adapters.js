
(function () {
  const adapters = {};
  let activeExchange = "DELTA";

  function registerAdapter(name, adapter) {
    const key = String(name).toUpperCase();

    if (!adapter || typeof adapter.getCandles !== "function") {
      throw new Error("Invalid market adapter");
    }

    adapters[key] = adapter;
  }

  function listExchanges() {
    return Object.keys(adapters);
  }

  function setExchange(name) {
    const key = String(name).toUpperCase();

    if (!adapters[key]) {
      throw new Error("Exchange not connected: " + key);
    }

    activeExchange = key;
  }

  async function getCandles(symbol, timeframe, count) {
    const adapter = adapters[activeExchange];

    if (!adapter) {
      throw new Error("No market data adapter connected");
    }

    const candles = await adapter.getCandles(
      symbol,
      timeframe,
      count
    );

    if (!Array.isArray(candles) || candles.length === 0) {
      throw new Error("No candle data received");
    }

    return candles.map(function (c) {
      return {
        time: Number(c.time),
        open: Number(c.open),
        high: Number(c.high),
        low: Number(c.low),
        close: Number(c.close),
        volume: Number(c.volume)
      };
    });
  }

  registerAdapter("DELTA", {
    getCandles: function (symbol, timeframe, count) {
      if (!window.BBPCandles) {
        throw new Error("Delta candle module not loaded");
      }

      return window.BBPCandles.getCandles(
        symbol,
        timeframe,
        count
      );
    }
  });

  window.BBPMarketData = {
    registerAdapter,
    listExchanges,
    setExchange,
    getCandles,
    getActiveExchange: function () {
      return activeExchange;
    }
  };

  console.log("BBP Market Adapter Engine loaded");
})();
