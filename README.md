# UEFA European Performance Spot Coefficient Predictor

Monte Carlo simulation engine and interactive dashboard predicting which nations will earn UEFA's extra Champions League spots for 2026/27.

## What This Does

The **UEFA European Performance Spot** awards the top 2 nations by single-season association coefficient an extra Champions League place. This tool simulates all remaining knockout matches across CL, EL, and Conference League (1 million iterations) to calculate each country's probability of finishing in the top 2.

## Key Features

- **Monte Carlo Engine** (`coefficient_engine.py`): 1M iteration simulation with Poisson goal modeling, aggregate scoring, and correct UEFA pre-drawn bracket routing
- **Worst-Case Scenario**: Separate 500K simulation where all English clubs are knocked out at R16
- **Interactive Dashboard**: 6-tab visualization with clickable simulation traces showing full bracket outcomes
- **Back-tested**: Validated against 3 previous seasons (2022/23, 2023/24, 2024/25) — all pass

## Current Results (as of 12 March 2026)

| Country | Current Coeff | Top-2 Probability | Mean Simulated |
|---------|:---:|:---:|:---:|
| England | 22.847 | 99.99% | 25.629 |
| Spain | 18.406 | 71.65% | 21.899 |
| Germany | 18.143 | 26.37% | 20.812 |
| Italy | 17.929 | 1.47% | 19.577 |
| France | 15.679 | 0.52% | 18.079 |

**Worst-case scenario** (all English clubs eliminated at R16): England still stays top-2 in **97.22%** of simulations.

## Live Dashboard

🔗 [View the interactive dashboard](https://msansoni.github.io/uefa-coefficient-predictor/)

## How to Run the Engine

```bash
python3 coefficient_engine.py
```

Generates `results.json` with full simulation data.

## Data Sources

- UEFA official coefficient data as of 12 March 2026
- R16 first leg scores from actual matches played 11-13 March 2026
- UEFA pre-drawn QF/SF bracket pairings

## Built with

- Python (Monte Carlo engine)
- Chart.js (data visualization)
- Created with [Perplexity Computer](https://www.perplexity.ai/computer)
