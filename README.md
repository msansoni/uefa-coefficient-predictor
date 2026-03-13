# UEFA Coefficient Bracket Predictor

Interactive Monte Carlo simulation for predicting which nations earn UEFA's extra Champions League spots for 2026/27.

## What This Does

The **UEFA European Performance Spot** awards the top 2 nations by single-season association coefficient an extra Champions League place. This tool lets you enter match results across CL, EL, and Conference League knockout rounds and instantly see how each result shifts the coefficient probabilities.

## Features

- **Interactive Bracket**: Enter second-leg scores for R16, QF, SF, and Final matches across all 3 competitions
- **Live Probability Updates**: 50K Monte Carlo simulations run in-browser on every result change
- **Club Badges & Flags**: Visual team identification with UEFA badges and nationality flags
- **Aggregate Scoring**: Correct two-legged tie resolution with penalty shootout handling
- **Pre-drawn Bracket Routing**: Follows the actual UEFA QF/SF draw paths
- **Coefficient Distribution Chart**: Live-updating probability distributions for all 5 nations
- **Overtake Probabilities**: Real-time tracking of which nations could overtake England

## Current Data (as of 12 March 2026)

| Country | Current Coeff | Top-2 Probability |
|---------|:---:|:---:|
| England | 22.847 | ~100% |
| Spain | 18.406 | ~72% |
| Germany | 18.143 | ~26% |
| Italy | 17.929 | ~1.5% |
| France | 15.679 | ~0.5% |

## Live Dashboard

🔗 [View the interactive predictor](https://msansoni.github.io/uefa-coefficient-predictor/)

## Technical Details

- **Engine**: JavaScript Monte Carlo simulation running entirely in-browser
- **Match Model**: Poisson distribution for goal scoring (λ=1.3-1.4 home, λ=1.1 away)
- **Simulations**: 50K iterations per update, 100K available via manual trigger
- **No backend required**: Pure client-side computation

## Built with

- JavaScript (Monte Carlo engine)
- Chart.js (data visualization)
- Created with [Perplexity Computer](https://www.perplexity.ai/computer)
