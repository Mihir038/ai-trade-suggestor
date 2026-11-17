import React, { useState, useEffect, Component } from 'react';
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import LiveChart from './components/LiveChart';
import LiveChartsCollageView from './components/LiveChartsCollageView';
import TradesView from './components/TradesView';
import TradeRecommendations from './components/TradeRecommendations';
import TradeExplanationModal from './components/TradeExplanationModal';
import BacktestLab from './components/BacktestLab';
import MarketScanner from './components/MarketScanner';
import PositionCalculator from './components/PositionCalculator';
import StrategiesKnowledgeBase from './components/StrategiesKnowledgeBase';
import TradeMonitor from './components/TradeMonitor';
import { useMarket } from './context/MarketContext';
import {
  X,
  AlertTriangle,
  Brain,
  TrendingUp,
  Activity,
  CheckCircle2
} from 'lucide-react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 max-w-xl mx-auto my-12 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl text-center space-y-4">
          <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-rose-900 dark:text-rose-200">Component Render Warning</h2>
          <p className="text-xs text-rose-600 dark:text-rose-300 font-mono">
            {this.state.error?.message || 'An unexpected rendering error occurred.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition cursor-pointer"
          >
            Retry Component
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [activeTab, setActiveTabState] = useState(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get('tab');
      if (tabParam && ['dashboard', 'live-chart', 'trades', 'backtest', 'scanner', 'strategies', 'calculator', 'history'].includes(tabParam)) {
        return tabParam;
      }
      if (window.location.hash) {
        const hash = window.location.hash.replace('#', '');
        if (['dashboard', 'live-chart', 'trades', 'backtest', 'scanner', 'strategies', 'calculator', 'history'].includes(hash)) {
          return hash;
        }
      }
    }
    return 'dashboard';
  });

  const setActiveTab = (tab) => {
    setActiveTabState(tab);
    if (typeof window !== 'undefined') {
      window.location.hash = tab;
    }
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && ['dashboard', 'live-chart', 'trades', 'backtest', 'scanner', 'strategies', 'calculator', 'history'].includes(hash)) {
        setActiveTabState(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const [selectedTradeForModal, setSelectedTradeForModal] = useState(null);
  const { lastAlert, setLastAlert, setSelectedInstrument, approveTrade, theme } = useMarket();

  const isDark = theme === 'dark';

  return (
    <ErrorBoundary>
      <div className={`min-h-screen flex antialiased transition-colors duration-200 ${
        isDark ? 'bg-[#0b0e14] text-slate-100' : 'bg-[#f8fafc] text-slate-800'
      }`}>
        {/* Left Navigation Sidebar matching screenshot */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto max-h-screen">
          {/* Floating High-Priority Alert Banner if new trade opportunity detected */}
          {lastAlert && (
            <div className={`border-b px-6 py-3 sticky top-0 z-40 backdrop-blur-md shadow-xs animate-fadeIn ${
              isDark
                ? 'bg-gradient-to-r from-indigo-950/90 via-slate-900/95 to-slate-900 border-indigo-500/30'
                : 'bg-gradient-to-r from-indigo-50 via-white to-slate-50 border-indigo-200'
            }`}>
              <div className="max-w-[1720px] mx-auto flex items-center justify-between text-xs gap-3">
                <div className="flex items-center space-x-2.5">
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
                  </span>
                  <span className="font-extrabold uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">
                    New AI Setup Alert:
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {lastAlert.signalType} {lastAlert.instrument} @ {lastAlert.currencySymbol}{lastAlert.entryPrice}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 hidden sm:inline">
                    Strategy: {lastAlert.strategyName} (Win Rate: {lastAlert.historicalWinRate})
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={async () => {
                      await approveTrade(lastAlert.id);
                      setSelectedInstrument(lastAlert.instrumentId);
                      setActiveTab('live-chart');
                      setLastAlert(null);
                    }}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center space-x-1 shadow-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve & Plot</span>
                  </button>
                  <button
                    onClick={() => {
                      setSelectedInstrument(lastAlert.instrumentId);
                      setSelectedTradeForModal(lastAlert);
                    }}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition cursor-pointer"
                  >
                    Inspect Setup
                  </button>
                  <button
                    onClick={() => setLastAlert(null)}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Main Body */}
          <main className="flex-1 p-6 lg:p-8 max-w-[1720px] w-full mx-auto space-y-6">
            {activeTab === 'dashboard' && (
              <ErrorBoundary>
                <DashboardView
                  onSelectExplanation={(trade) => setSelectedTradeForModal(trade)}
                  onOpenChartTab={() => setActiveTab('live-chart')}
                />
              </ErrorBoundary>
            )}

            {activeTab === 'live-chart' && (
              <ErrorBoundary>
                <LiveChartsCollageView onSelectExplanation={(trade) => setSelectedTradeForModal(trade)} />
              </ErrorBoundary>
            )}

            {(activeTab === 'trades' || activeTab === 'pending') && (
              <ErrorBoundary>
                <TradesView
                  onSelectExplanation={(trade) => setSelectedTradeForModal(trade)}
                  onOpenFocusedChart={(trade) => {
                    setSelectedInstrument(trade.instrumentId);
                    setActiveTab('live-chart');
                  }}
                />
              </ErrorBoundary>
            )}

            {activeTab === 'backtest' && (
              <ErrorBoundary>
                <BacktestLab />
              </ErrorBoundary>
            )}

            {activeTab === 'scanner' && (
              <ErrorBoundary>
                <MarketScanner onSelectAsset={() => setActiveTab('live-chart')} />
              </ErrorBoundary>
            )}

            {activeTab === 'strategies' && (
              <ErrorBoundary>
                <StrategiesKnowledgeBase
                  onOpenBacktest={(stratId) => {
                    setActiveTab('backtest');
                  }}
                />
              </ErrorBoundary>
            )}

            {activeTab === 'calculator' && (
              <ErrorBoundary>
                <PositionCalculator />
              </ErrorBoundary>
            )}

            {activeTab === 'history' && (
              <ErrorBoundary>
                <TradeMonitor onSelectExplanation={(trade) => setSelectedTradeForModal(trade)} />
              </ErrorBoundary>
            )}
          </main>
        </div>

        {/* AI Trade Explanation Modal (Section 6) */}
        {selectedTradeForModal && (
          <TradeExplanationModal
            trade={selectedTradeForModal}
            onClose={() => setSelectedTradeForModal(null)}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}
