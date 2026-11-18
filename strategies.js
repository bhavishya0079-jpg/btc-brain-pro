
(function () {

  function analyze(candles) {

    const I = window.BBPIndicators;

    if (!I) {
      throw new Error("Indicators module not loaded");
    }

    if (!Array.isArray(candles) || candles.length < 50) {
      return {
        signal: "WAIT",
        reason: "Minimum 50 candles required"
      };
    }

    const close = candles.map(c => Number(c.close));

    if (!close.every(Number.isFinite)) {
      throw new Error("Invalid candle prices");
    }

    // Calculate indicators
    const ema20 = I.ema(close, 20);
    const ema50 = I.ema(close, 50);
    const rsi = I.rsi(close, 14);
    const macd = I.macd(close);
    const bb = I.bollinger(close, 20);
    const atr = I.atr(candles, 14);

    const last = close.length - 1;

    const price = close[last];
    const e20 = ema20[last];
    const e50 = ema50[last];
    const r = rsi[last];
    const m = macd.line[last];
    const s = macd.signal[last];
    const upper = bb.upper[last];
    const lower = bb.lower[last];
    const a = atr[last];

    const values = [
      price, e20, e50, r, m, s,
      upper, lower, a
    ];

    if (!values.every(Number.isFinite) || a <= 0) {
      return {
        signal: "WAIT",
        reason: "Indicator data not ready"
      };
    }

    // Trading conditions
    const longCondition =
      e20 > e50 &&
      price > e20 &&
      r >= 50 && r <= 70 &&
      m > s;

    const shortCondition =
      e20 < e50 &&
      price < e20 &&
      r >= 30 && r <= 50 &&
      m < s;

    let signal = "WAIT";
    let entry = null;
    let stopLoss = null;
    let target = null;

    const riskDistance = a * 1.5;
    const rewardDistance = riskDistance * 2;

    if (longCondition) {

      signal = "LONG";
      entry = price;
      stopLoss = entry - riskDistance;
      target = entry + rewardDistance;

    } else if (shortCondition) {

      signal = "SHORT";
      entry = price;
      stopLoss = entry + riskDistance;
      target = entry - rewardDistance;

    }

    return {

      signal: signal,

      entry: entry,

      stopLoss: stopLoss,

      target: target,

      riskReward: signal === "WAIT" ? null : "1:2",

      indicators: {
        EMA20: e20,
        EMA50: e50,
        RSI: r,
        MACD: m,
        MACDSignal: s,
        BollingerUpper: upper,
        BollingerLower: lower,
        ATR: a
      },

      reason: signal === "LONG"
        ? "Bullish conditions confirmed"
        : signal === "SHORT"
        ? "Bearish conditions confirmed"
        : "No clear trading setup"

    };

  }

  window.BBPStrategies = {
    analyze: analyze
  };

  console.log("BBP Strategies module loaded");

})();
