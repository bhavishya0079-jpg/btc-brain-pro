
(function () {
  function ema(values, period) {
    const result = Array(values.length).fill(null);
    if (values.length < period) return result;

    const multiplier = 2 / (period + 1);
    let average = values
      .slice(0, period)
      .reduce((a, b) => a + b, 0) / period;

    result[period - 1] = average;

    for (let i = period; i < values.length; i++) {
      average = (values[i] - average) * multiplier + average;
      result[i] = average;
    }

    return result;
  }

  function rsi(values, period = 14) {
    const result = Array(values.length).fill(null);
    if (values.length <= period) return result;

    let gains = 0;
    let losses = 0;

    for (let i = 1; i <= period; i++) {
      const change = values[i] - values[i - 1];
      gains += Math.max(change, 0);
      losses += Math.max(-change, 0);
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    function calculate() {
      if (avgLoss === 0) return avgGain === 0 ? 50 : 100;
      const rs = avgGain / avgLoss;
      return 100 - (100 / (1 + rs));
    }

    result[period] = calculate();

    for (let i = period + 1; i < values.length; i++) {
      const change = values[i] - values[i - 1];

      avgGain = (
        avgGain * (period - 1) + Math.max(change, 0)
      ) / period;

      avgLoss = (
        avgLoss * (period - 1) + Math.max(-change, 0)
      ) / period;

      result[i] = calculate();
    }

    return result;
  }

  function macd(values, fast = 12, slow = 26, signalPeriod = 9) {
    const fastEMA = ema(values, fast);
    const slowEMA = ema(values, slow);

    const line = values.map((_, i) =>
      fastEMA[i] === null || slowEMA[i] === null
        ? null
        : fastEMA[i] - slowEMA[i]
    );

    const validStart = slow - 1;
    const compact = line.slice(validStart).filter(v => v !== null);
    const signalCompact = ema(compact, signalPeriod);

    const signal = Array(values.length).fill(null);
    const histogram = Array(values.length).fill(null);

    for (let i = 0; i < signalCompact.length; i++) {
      const index = validStart + i;

      if (signalCompact[i] !== null) {
        signal[index] = signalCompact[i];
        histogram[index] = line[index] - signal[index];
      }
    }

    return { line, signal, histogram };
  }

  function bollinger(values, period = 20, multiplier = 2) {
    const middle = Array(values.length).fill(null);
    const upper = Array(values.length).fill(null);
    const lower = Array(values.length).fill(null);

    for (let i = period - 1; i < values.length; i++) {
      const slice = values.slice(i - period + 1, i + 1);
      const mean = slice.reduce((a, b) => a + b, 0) / period;

      const variance = slice.reduce(
        (sum, value) => sum + Math.pow(value - mean, 2),
        0
      ) / period;

      const deviation = Math.sqrt(variance);

      middle[i] = mean;
      upper[i] = mean + multiplier * deviation;
      lower[i] = mean - multiplier * deviation;
    }

    return { middle, upper, lower };
  }

  function atr(candles, period = 14) {
    const result = Array(candles.length).fill(null);
    if (candles.length <= period) return result;

    const trueRanges = candles.map((candle, i) => {
      const high = Number(candle.high);
      const low = Number(candle.low);

      if (i === 0) return high - low;

      const previousClose = Number(candles[i - 1].close);

      return Math.max(
        high - low,
        Math.abs(high - previousClose),
        Math.abs(low - previousClose)
      );
    });

    let average = trueRanges
      .slice(1, period + 1)
      .reduce((a, b) => a + b, 0) / period;

    result[period] = average;

    for (let i = period + 1; i < candles.length; i++) {
      average = (
        average * (period - 1) + trueRanges[i]
      ) / period;

      result[i] = average;
    }

    return result;
  }

  window.BBPIndicators = {
    ema,
    rsi,
    macd,
    bollinger,
    atr
  };

  console.log("BBP Indicators module loaded");
})();
