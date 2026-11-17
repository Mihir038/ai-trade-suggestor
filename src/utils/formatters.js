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

