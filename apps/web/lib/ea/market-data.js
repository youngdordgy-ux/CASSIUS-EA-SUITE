
const SUPPORTED_INSTRUMENTS = [
  "EURUSD",
  "GBPUSD",
  "USDJPY",
  "AUDUSD",
  "USDCAD",
];

const SUPPORTED_TIMEFRAMES = [
  "M1",
  "M5",
  "M15",
  "M30",
  "H1",
  "H4",
  "D1",
];

export function validateCandle(candle) {
  const errors = [];

  if (!candle || typeof candle !== "object") {
    return {
      valid: false,
      errors: ["Invalid candle record."],
    };
  }

  const instrument = String(candle.instrument || "").toUpperCase();
  const timeframe = String(candle.timeframe || "").toUpperCase();

  if (!SUPPORTED_INSTRUMENTS.includes(instrument)) {
    errors.push("Unsupported instrument.");
  }

  if (!SUPPORTED_TIMEFRAMES.includes(timeframe)) {
    errors.push("Unsupported timeframe.");
  }

  const openTime = new Date(candle.open_time);

  if (Number.isNaN(openTime.getTime())) {
    errors.push("Invalid candle timestamp.");
  }

  const prices = {
    open_price: Number(candle.open_price),
    high_price: Number(candle.high_price),
    low_price: Number(candle.low_price),
    close_price: Number(candle.close_price),
    volume: Number(candle.volume ?? 0),
  };

  for (const [field, value] of Object.entries(prices)) {
    if (!Number.isFinite(value)) {
      errors.push(`Invalid ${field}.`);
    }
  }

  if (
    Object.values(prices).every(Number.isFinite)
  ) {
    if (prices.high_price < prices.low_price) {
      errors.push("High price cannot be below low price.");
    }

    if (
      prices.high_price <
      Math.max(prices.open_price, prices.close_price)
    ) {
      errors.push("High price is inconsistent.");
    }

    if (
      prices.low_price >
      Math.min(prices.open_price, prices.close_price)
    ) {
      errors.push("Low price is inconsistent.");
    }

    if (prices.volume < 0) {
      errors.push("Volume cannot be negative.");
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    candle: {
      instrument,
      timeframe,
      open_time: openTime.toISOString(),
      ...prices,
      data_source: String(
        candle.data_source || "historical"
      ),
    },
  };
}
