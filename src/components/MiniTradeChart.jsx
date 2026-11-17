import React, { useEffect, useRef } from 'react';
import { createChart, ColorType, CandlestickSeries } from 'lightweight-charts';
import { useMarket } from '../context/MarketContext';

export default function MiniTradeChart({ trade, height = 240 }) {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const { theme, prices } = useMarket();
  const isDark = theme === 'dark';

  useEffect(() => {
    let isMounted = true;
    const container = chartContainerRef.current;
    if (!container) return;

    // Fetch candle data for this instrument
    const instId = trade.instrumentId || 'NIFTY';
    fetch(`/api/candles/${instId}?timeframe=15m`)
      .then(r => r.json())
      .then(data => {
        if (!isMounted || !chartContainerRef.current) return;
        if (!data.success || !Array.isArray(data.candles) || data.candles.length === 0) return;

        // Clean up old chart instance
        if (chartRef.current) {
          try {
            chartRef.current.remove();
          } catch (e) {}
          chartRef.current = null;
        }

        const chart = createChart(chartContainerRef.current, {
          width: chartContainerRef.current.clientWidth || 400,
          height: height,
          layout: {
            background: { type: ColorType.Solid, color: isDark ? '#0b0f19' : '#f8fafc' },
            textColor: isDark ? '#64748b' : '#94a3b8',
            fontSize: 10
          },
          grid: {
            vertLines: { color: isDark ? 'rgba(30, 41, 59, 0.3)' : 'rgba(226, 232, 240, 0.6)' },
            horzLines: { color: isDark ? 'rgba(30, 41, 59, 0.3)' : 'rgba(226, 232, 240, 0.6)' }
          },
          timeScale: {
            visible: true,
            borderColor: isDark ? '#1e293b' : '#e2e8f0',
            timeVisible: true
          },
          rightPriceScale: {
            borderColor: isDark ? '#1e293b' : '#e2e8f0',
            scaleMargins: { top: 0.1, bottom: 0.1 }
          },
          crosshair: {
            vertLine: { visible: false },
            horzLine: { visible: false }
          },
          handleScroll: false,
          handleScale: false
        });

        const candleSeries = chart.addSeries(CandlestickSeries, {
          upColor: '#10b981',
          downColor: '#f43f5e',
          borderVisible: false,
          wickUpColor: '#10b981',
          wickDownColor: '#f43f5e'
        });

        candleSeries.setData(data.candles);

        // Draw Entry Line
        candleSeries.createPriceLine({
          price: trade.entryPrice,
          color: trade.signalType === 'BUY' ? '#10b981' : '#f43f5e',
          lineWidth: 2,
          lineStyle: 0,
          axisLabelVisible: true,
          title: `ENTRY ${trade.currencySymbol || '₹'}${trade.entryPrice}`
        });

        // Draw Stop Loss Line
        if (trade.stopLoss) {
          candleSeries.createPriceLine({
            price: trade.stopLoss,
            color: '#f43f5e',
            lineWidth: 1.5,
            lineStyle: 2,
            axisLabelVisible: true,
            title: `SL ${trade.currencySymbol || '₹'}${trade.stopLoss}`
          });
        }

        // Draw Target 1 Line
        if (trade.target1) {
          candleSeries.createPriceLine({
            price: trade.target1,
            color: '#10b981',
            lineWidth: 1.5,
            lineStyle: 3,
            axisLabelVisible: true,
            title: `T1 ${trade.currencySymbol || '₹'}${trade.target1}`
          });
        }

        // Fit content cleanly
        chart.timeScale().fitContent();

        chartRef.current = chart;
        seriesRef.current = candleSeries;
      })
      .catch(err => console.error('MiniChart load error:', err));

    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        chartRef.current.resize(chartContainerRef.current.clientWidth, height);
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      isMounted = false;
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        try {
          chartRef.current.remove();
        } catch (e) {}
        chartRef.current = null;
      }
    };
  }, [trade.id, trade.instrumentId, isDark]);

  return (
    <div className="w-full relative overflow-hidden rounded-xl">
      <div ref={chartContainerRef} style={{ height }} className="w-full" />
    </div>
  );
}

