import { sma, rsi } from './agents/trader/signals.js';
import { breakout } from './agents/trader/detectors.js';
import { buildScenarios } from './agents/trader/scenarios.js';
import { positionSize } from './agents/trader/risk.js';
import { summarizeNews } from './agents/economist/news_summarizer.js';
import { fuse } from './agents/fusion.js';
import { VerdictSchema } from './core/schema.js';

export async function analyze({symbol, candles, news, span, equity=10000}) {
  const closes = candles.map(c=>c.close);
  const rsiNow = rsi(closes);
  const bo = breakout(closes);
  const scenarios = buildScenarios(closes.at(-1), span);
  const reasons = [
    `RSI ${rsiNow}`,
    bo.isBreakout ? `Breakout nad ${bo.level}` : `Bez breakoutu (rez. ${bo.level})`,
    ...summarizeNews(news)
  ];
  const verdict = fuse({
    scenarios,
    reasons,
    span,
    confidence: 60 + (bo.isBreakout ? 10 : 0) // demo
  });

  // risk příklad
  const stopDist = Math.abs(closes.at(-1) - span.min);
  const size = positionSize(equity, 1, stopDist);

  return { verdict, risk:{ size, stopDist } };
}
