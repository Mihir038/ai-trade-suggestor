import React, { useEffect, useRef, memo } from 'react';

const TV_SYMBOL_MAP = {
  NIFTY: 'NSE:NIFTY',
  BANKNIFTY: 'NSE:BANKNIFTY',
  SENSEX: 'BSE:SENSEX',
  CRUDEOIL: 'MCX:CRUDEOIL1!',
  BTCUSD: 'BINANCE:BTCUSDT'
};

const TV_INTERVAL_MAP = {
  '1m': '1',
  '5m': '5',
  '15m': '15',
  '1h': '60',
  '1D': 'D'
};

function TradingViewWidget({ instrumentId = 'NIFTY', timeframe = '15m', theme = 'dark', height = 520 }) {
  const containerIdRef = useRef(`tv_widget_${Math.random().toString(36).substring(7)}`);
  const containerRef = useRef(null);

  const tvSymbol = TV_SYMBOL_MAP[instrumentId] || 'NSE:NIFTY';
  const tvInterval = TV_INTERVAL_MAP[timeframe] || '15';

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.innerHTML = '';

    const widgetDiv = document.createElement('div');
    widgetDiv.id = containerIdRef.current;
    widgetDiv.style.width = '100%';
    widgetDiv.style.height = '100%';
    container.appendChild(widgetDiv);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.type = 'text/javascript';
    script.async = true;
    script.onload = () => {
      if (typeof window.TradingView !== 'undefined' && document.getElementById(containerIdRef.current)) {
        try {
          new window.TradingView.widget({
            autosize: true,
            symbol: tvSymbol,
            interval: tvInterval,
            timezone: 'Asia/Kolkata',
            theme: theme === 'dark' ? 'dark' : 'light',
            style: '1',
            locale: 'in',
            toolbar_bg: theme === 'dark' ? '#0d111a' : '#ffffff',
            enable_publishing: false,
            allow_symbol_change: false,
            container_id: containerIdRef.current,
            hide_side_toolbar: false,
            details: true,
            hotlist: true,
            calendar: true
          });
        } catch (e) {
          console.warn('TradingView widget initialization warning:', e);
        }
      }
    };
    container.appendChild(script);

    return () => {
      if (container) container.innerHTML = '';
    };
  }, [tvSymbol, tvInterval, theme]);

  return (
    <div
      ref={containerRef}
      className="w-full relative"
      style={{ height: `${height}px` }}
    />
  );
}

export default memo(TradingViewWidget);
