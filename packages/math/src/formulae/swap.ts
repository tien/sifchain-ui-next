import BigNumber from "bignumber.js";

/**
 * calculate slip adjustment based on formula 1 - ABS((R a - r A)/((2 r + R) (a + A)))
 * @param leftAmount
 * @param rightAmount
 * @param leftPoolAmount
 * @param rightPoolAmount
 * @returns slip adjustment
 */
export const slipAdjustment = (
  leftAmount: BigNumber.Value,
  rightAmount: BigNumber.Value,
  leftPoolAmount: BigNumber.Value,
  rightPoolAmount: BigNumber.Value,
) => {
  const l = new BigNumber(leftAmount);
  const r = new BigNumber(rightAmount);
  const lp = new BigNumber(leftPoolAmount);
  const rp = new BigNumber(rightPoolAmount);

  const slipAdjDenominator = l.plus(lp).times(r.plus(rp));
  const slipAdjustmentReciprocal = lp.times(r).gt(l.times(rp))
    ? lp.times(r).minus(l.times(rp)).div(slipAdjDenominator)
    : l.times(rp).minus(lp.times(r)).div(slipAdjDenominator);

  return new BigNumber(1).minus(slipAdjustmentReciprocal);
};

/**
 * calculate Swap Result based on formula ( x * X * Y ) / ( x + X ) ^ 2
 * @param fromAmount
 * @param fromCoinPoolAmount
 * @param toCoinPoolAmount
 * @returns amount obtained from swap
 */
export const swapResult = (
  fromAmount: BigNumber.Value,
  fromCoinPoolAmount: BigNumber.Value,
  toCoinPoolAmount: BigNumber.Value,
) => {
  const f = new BigNumber(fromAmount);
  const fp = new BigNumber(fromCoinPoolAmount);
  const tp = new BigNumber(toCoinPoolAmount);

  if (f.isZero() || fp.isZero() || tp.isZero()) {
    return new BigNumber(0);
  }
  const xPlusX = f.plus(fp);
  return f.times(fp).times(tp).div(xPlusX.times(xPlusX));
};

/**
 * calculate Swap Result based on formula (( x * X * Y ) / ( x + X ) ^ 2) * (1 + adjustment / 100)
 * @param fromAmount
 * @param fromCoinPoolAmount
 * @param toCoinPoolAmount
 * @param adjustment PMTP purchasing power adjustment
 * @returns amount obtained from swap
 */
export const pmtpSwapResult = (
  fromAmount: BigNumber.Value,
  fromCoinPoolAmount: BigNumber.Value,
  toCoinPoolAmount: BigNumber.Value,
  adjustment: BigNumber.Value,
) => {
  const f = new BigNumber(fromAmount);
  const fp = new BigNumber(fromCoinPoolAmount);
  const tp = new BigNumber(toCoinPoolAmount);
  const a = new BigNumber(adjustment);

  if (f.isZero() || fp.isZero() || tp.isZero()) {
    return new BigNumber(0);
  }

  const adjustmentPercentage = a.div(100_000_000_000_000_000_000);

  return swapResult(f, fp, tp).times(adjustmentPercentage.plus(1));
};

/**
 * formula: S = (x * X * Y) / (x + X) ^ 2
 * reverse Formula: x = ( -2*X*S + X*Y - X*sqrt( Y*(Y - 4*S) ) ) / 2*S
 * ok to accept a little precision loss as reverse swap amount can be rough
 * @param targetAmount
 * @param targetCoinPoolAmount
 * @param fromCoinPoolAmount
 * @returns
 */
export const swapAmountNeeded = (
  targetAmount: BigNumber.Value,
  targetCoinPoolAmount: BigNumber.Value,
  fromCoinPoolAmount: BigNumber.Value,
) => {
  const t = new BigNumber(targetAmount);
  const tp = new BigNumber(targetCoinPoolAmount);
  const fp = new BigNumber(fromCoinPoolAmount);
  // Adding a check here because sqrt of a negative number will throw an exception
  if (t.isZero() || tp.isZero() || t.times(4).gt(fp)) {
    return new BigNumber(0);
  }
  const term1 = new BigNumber(-2).times(tp).times(t);
  const term2 = tp.times(fp);
  const underRoot = fp.times(fp.minus(t.times(4)));
  const term3 = tp.times(underRoot.sqrt());
  const numerator = term1.plus(term2).minus(term3);
  const denominator = t.times(2);
  const x = numerator.div(denominator);

  return x.gte(0) ? x : new BigNumber(0);
};

/**
 * calculate Provider Fee according to the formula: ( x^2 * Y ) / ( x + X )^2
 * @param fromAmount swap Amount
 * @param fromCoinPoolAmount external Balance
 * @param toCoinPoolAmount native Balance
 * @returns providerFee
 */
export const providerFee = (
  fromAmount: BigNumber.Value,
  fromCoinPoolAmount: BigNumber.Value,
  toCoinPoolAmount: BigNumber.Value,
) => {
  const f = new BigNumber(fromAmount);
  const fp = new BigNumber(fromCoinPoolAmount);
  const tp = new BigNumber(toCoinPoolAmount);

  if (f.isZero() || fp.isZero() || tp.isZero()) {
    return new BigNumber(0);
  }

  const xPlusX = f.plus(fp);
  return f.times(f).times(tp).div(xPlusX.times(xPlusX));
};

/**
 * calculate price impact according to the formula (x) / (x + X)
 * @param fromAmount swap Amount
 * @param toCoinPoolAmount external Balance
 * @returns
 */
export const priceImpact = (
  fromAmount: BigNumber.Value,
  toCoinPoolAmount: BigNumber.Value,
) => {
  const f = new BigNumber(fromAmount);

  if (f.isZero()) {
    return new BigNumber(0);
  }

  const denominator = f.plus(toCoinPoolAmount);
  return f.div(denominator);
};