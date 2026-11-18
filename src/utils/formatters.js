/**
 * Utility formatters for financial prices, currencies, percentages, and dates
 */

export function formatPrice(price, currency = 'INR', tickSize = 0.05) {
  if (price === undefined || price === null || isNaN(price)) return '0.00';
  const decimals = tickSize < 0.1 ? 2 : (price > 1000 ? 2 : 2);
  const num = Number(price);

  if (currency === 'INR') {
    // Format in Indian numbering system (lakhs/crores)
    return num.toLocaleString('en-IN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }

  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

export function formatCurrency(amount, currency = 'INR', currencySymbol = '₹') {
  if (amount === undefined || amount === null || isNaN(amount)) return `${currencySymbol}0.00`;
  const formatted = formatPrice(Math.abs(amount), currency);
  const sign = amount < 0 ? '-' : '';
  return `${sign}${currencySymbol}${formatted}`;
}

export function formatPercent(pct) {
  if (pct === undefined || pct === null || isNaN(pct)) return '+0.00%';
  const num = Number(pct);
  const sign = num > 0 ? '+' : '';
  return `${sign}${num.toFixed(2)}%`;
}

export function formatTime(timestamp) {
  if (!timestamp) return '--:--';
  const date = typeof timestamp === 'number' ? new Date(timestamp * 1000) : new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function formatDateTime(timestamp) {
  if (!timestamp) return '--';
  const date = typeof timestamp === 'number' ? new Date(timestamp * 1000) : new Date(timestamp);
  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Format timestamp into Indian Standard Time (IST, UTC+5:30)
 * Example: "18 Nov '26, 11:30 AM"
 */
export function formatISTDateTime(timestamp) {
  if (!timestamp) return '--';
  const date = typeof timestamp === 'number' ? new Date(timestamp * 1000) : new Date(timestamp);
  return date.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Format timestamp into IST Time only (e.g. "11:30")
 */
export function formatISTTime(timestamp) {
  if (!timestamp) return '--:--';
  const date = typeof timestamp === 'number' ? new Date(timestamp * 1000) : new Date(timestamp);
  return date.toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

/**
 * Format Lightweight Charts tick marks in IST timezone
 * TickMarkType: Year = 0, Month = 1, DayOfMonth = 2, Time = 3, TimeWithSeconds = 4
 */
export function formatISTTickMark(time, tickMarkType) {
  const date = typeof time === 'number' ? new Date(time * 1000) : new Date(time);
  const tz = 'Asia/Kolkata';
  switch (tickMarkType) {
    case 0: // Year
      return date.toLocaleDateString('en-IN', { timeZone: tz, year: 'numeric' });
    case 1: // Month
      return date.toLocaleDateString('en-IN', { timeZone: tz, month: 'short' });
    case 2: // Day of month
      return date.toLocaleDateString('en-IN', { timeZone: tz, day: 'numeric', month: 'short' });
    case 3: // Time
      return date.toLocaleTimeString('en-IN', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false });
    case 4: // Time with seconds
      return date.toLocaleTimeString('en-IN', { timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    default:
      return date.toLocaleTimeString('en-IN', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false });
  }
}


