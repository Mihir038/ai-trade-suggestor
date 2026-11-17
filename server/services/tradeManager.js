/**
 * Continuous Trade Recommendation Lifecycle Manager
 * 
 * Strict Workflow:
 * 1. AI signals are generated into PENDING APPROVALS.
 * 2. Only user-approved trades become ACTIVE and are plotted onto charts.
 * 3. Every approved trade records precise execution timestamp and date.
 * 4. Completed trades preserve full execution and exit audit trails.
 */

class TradeLifecycleManager {
  constructor() {
    this.pendingApprovals = [];
    this.activeRecommendations = []; // Only user-approved executed trades
    this.completedTrades = [];
    this.tradeHistoryLimit = 100;
  }

  // Format date and time for human-friendly institutional display
  formatDateTime(isoString) {
    const d = isoString ? new Date(isoString) : new Date();
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  }

  // Adds a newly identified setup to Pending Approvals queue
  addPendingSignal(signal) {
    // Avoid duplicate pending signal on same instrument with same strategy
    const existingPending = this.pendingApprovals.find(
      r => r.instrumentId === signal.instrumentId &&
           r.strategyKey === signal.strategyKey &&
           r.signalType === signal.signalType
    );
    if (existingPending) {
      return false;
    }

    // Avoid duplicate if already active/approved
    const existingActive = this.activeRecommendations.find(
      r => r.instrumentId === signal.instrumentId &&
           r.strategyKey === signal.strategyKey &&
           r.signalType === signal.signalType
    );
    if (existingActive) {
      return false;
    }

    const nowIso = new Date().toISOString();
    const pendingItem = {
      ...signal,
      id: signal.id || `SIG-${signal.instrumentId}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      status: 'PENDING_APPROVAL',
      generatedAt: signal.generatedAt || nowIso,
      generatedAtFormatted: this.formatDateTime(signal.generatedAt || nowIso),
      isApproved: false
    };

    // Limit pending queue to 10 most recent high-probability setups
    this.pendingApprovals.unshift(pendingItem);
    if (this.pendingApprovals.length > 10) {
      this.pendingApprovals.pop();
    }

    return pendingItem;
  }

  // Approves and executes a pending trade signal
  approveTrade(signalId) {
    const idx = this.pendingApprovals.findIndex(s => s.id === signalId);
    if (idx === -1) {
      // Check if already approved
      const alreadyActive = this.activeRecommendations.find(s => s.id === signalId);
      if (alreadyActive) {
        return { success: true, trade: alreadyActive, message: 'Trade is already active and set on graph.' };
      }
      return { success: false, error: 'Trade signal not found in pending approvals.' };
    }

    const [pendingSignal] = this.pendingApprovals.splice(idx, 1);
    const nowIso = new Date().toISOString();

    const executedTrade = {
      ...pendingSignal,
      status: 'ACTIVE',
      isApproved: true,
      executedAt: nowIso,
      executedAtFormatted: this.formatDateTime(nowIso),
      executionPrice: pendingSignal.entryPrice,
      currentPrice: pendingSignal.currentPrice || pendingSignal.entryPrice,
      pnl: 0,
      pnlPercentage: 0,
      highWatermark: pendingSignal.entryPrice,
      lowWatermark: pendingSignal.entryPrice
    };

    this.activeRecommendations.unshift(executedTrade);
    return { success: true, trade: executedTrade };
  }

  // Rejects / dismisses a pending trade signal
  rejectTrade(signalId, reason = 'User Dismissed') {
    const idx = this.pendingApprovals.findIndex(s => s.id === signalId);
    if (idx === -1) {
      return { success: false, error: 'Trade signal not found in pending approvals.' };
    }

    const [rejected] = this.pendingApprovals.splice(idx, 1);
    return { success: true, dismissedId: signalId, reason };
  }

  // Evaluates all APPROVED active recommendations against new real price tick
  updatePrice(instrumentId, currentPrice) {
    const updatedSignals = [];

    // Also update current price for pending signals so user sees live quote
    this.pendingApprovals.forEach(pending => {
      if (pending.instrumentId === instrumentId) {
        if (pending.isOptionTrade) {
          const delta = pending.greeks?.delta || 0.5;
          const spotDiff = pending.signalType === 'BUY'
            ? (currentPrice - (pending.underlyingSpot || currentPrice))
            : ((pending.underlyingSpot || currentPrice) - currentPrice);
          pending.currentPrice = Math.max(0.5, Number((pending.entryPrice + spotDiff * delta).toFixed(2)));
        } else {
          pending.currentPrice = currentPrice;
        }
      }
    });

    for (let i = this.activeRecommendations.length - 1; i >= 0; i--) {
      const rec = this.activeRecommendations[i];
      if (rec.instrumentId !== instrumentId) continue;

      const isBuy = rec.signalType === 'BUY';

      if (rec.isOptionTrade) {
        const delta = rec.greeks?.delta || 0.5;
        const spotDiff = isBuy 
          ? (currentPrice - (rec.underlyingSpot || currentPrice)) 
          : ((rec.underlyingSpot || currentPrice) - currentPrice);
        const estimatedOptionPrice = Math.max(0.5, Number((rec.entryPrice + spotDiff * delta).toFixed(2)));
        rec.currentPrice = estimatedOptionPrice;

        // Watermarks on option premium
        if (estimatedOptionPrice > rec.highWatermark) rec.highWatermark = estimatedOptionPrice;
        if (estimatedOptionPrice < rec.lowWatermark) rec.lowWatermark = estimatedOptionPrice;

        const premiumDiff = estimatedOptionPrice - rec.entryPrice;
        rec.pnlPoints = Number(premiumDiff.toFixed(2));
        rec.pnl = Number((premiumDiff * rec.suggestedQuantity).toFixed(2));
        rec.pnlPercentage = Number(((premiumDiff / rec.entryPrice) * 100).toFixed(2));
      } else {
        rec.currentPrice = currentPrice;

        // Update watermarks
        if (currentPrice > rec.highWatermark) rec.highWatermark = currentPrice;
        if (currentPrice < rec.lowWatermark) rec.lowWatermark = currentPrice;

        // Calculate real-time floating PnL
        const pointsDiff = isBuy ? (currentPrice - rec.entryPrice) : (rec.entryPrice - currentPrice);
        rec.pnlPoints = Number(pointsDiff.toFixed(2));
        rec.pnl = Number((pointsDiff * rec.suggestedQuantity).toFixed(2));
        rec.pnlPercentage = Number(((pointsDiff / rec.entryPrice) * 100).toFixed(2));
      }

      let completed = false;
      let exitReason = '';
      let exitPrice = rec.currentPrice;

      // 1. Check Stop Loss
      if ((isBuy && rec.currentPrice <= rec.stopLoss) || (!isBuy && rec.currentPrice >= rec.stopLoss)) {
        completed = true;
        exitPrice = rec.stopLoss;
        exitReason = rec.stopMovedToBreakeven ? 'Breakeven Stop Hit (Profit Protected)' : 'Stop Loss Hit';
        rec.status = rec.stopMovedToBreakeven ? 'BREAKEVEN' : 'STOPPED_OUT';
      }
      // 2. Check Target 3 (Full Target Achieved)
      else if ((isBuy && rec.currentPrice >= rec.target3) || (!isBuy && rec.currentPrice <= rec.target3)) {
        completed = true;
        exitPrice = rec.target3;
        exitReason = 'Target 3 (Full Objective) Reached';
        rec.status = 'TARGET_3_HIT';
      }
      // 3. Check Target 2
      else if ((isBuy && rec.currentPrice >= rec.target2) || (!isBuy && rec.currentPrice <= rec.target2)) {
        if (rec.status !== 'TARGET_2_HIT' && rec.status !== 'TARGET_3_HIT') {
          rec.status = 'TARGET_2_HIT';
          rec.notes = 'Target 2 reached. 80% cumulative profit booked.';
        }
      }
      // 4. Check Target 1
      else if ((isBuy && rec.currentPrice >= rec.target1) || (!isBuy && rec.currentPrice <= rec.target1)) {
        if (rec.status === 'ACTIVE') {
          rec.status = 'TARGET_1_HIT';
          rec.stopLoss = rec.entryPrice; // Automatically adjust SL to breakeven
          rec.stopMovedToBreakeven = true;
          rec.notes = 'Target 1 hit! Stop Loss moved to Entry Price to eliminate downside risk.';
        }
      }

      if (completed) {
        const finalDiff = isBuy ? (exitPrice - rec.entryPrice) : (rec.entryPrice - exitPrice);
        const finalPnlCash = Number((finalDiff * rec.suggestedQuantity).toFixed(2));
        const finalPnlPct = Number(((finalDiff / rec.entryPrice) * 100).toFixed(2));
        const nowIso = new Date().toISOString();

        const completedRecord = {
          ...rec,
          exitPrice,
          exitTime: nowIso,
          exitTimeFormatted: this.formatDateTime(nowIso),
          pnl: finalPnlCash,
          pnlPercentage: finalPnlPct,
          isWin: finalPnlCash > 0,
          exitReason
        };

        this.completedTrades.unshift(completedRecord);
        if (this.completedTrades.length > this.tradeHistoryLimit) {
          this.completedTrades.pop();
        }

        this.activeRecommendations.splice(i, 1);
        updatedSignals.push(completedRecord);
      } else {
        updatedSignals.push(rec);
      }
    }

    return updatedSignals;
  }

  getPendingApprovals() {
    return this.pendingApprovals;
  }

  getActiveRecommendations() {
    return this.activeRecommendations;
  }

  getCompletedTrades() {
    return this.completedTrades;
  }
}

module.exports = { TradeLifecycleManager };
