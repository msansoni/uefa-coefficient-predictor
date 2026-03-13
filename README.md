# UEFA Coefficient Bracket Predictor

Interactive Monte Carlo simulation for predicting UEFA country coefficient standings for the 2025/26 season. Enter match results and watch probabilities update in real time.

## How It Works

The app runs 100,000 Monte Carlo simulations in your browser to project final coefficient standings based on the remaining UEFA fixtures. As you enter actual match results, the simulations re-run with your inputs locked in, updating probabilities for each nation's final ranking.

## Files

- `index.html` — Single-page application UI
- `engine.js` — Monte Carlo simulation engine (Poisson-based match simulation)
- `clubs.js` — Club metadata (badges, flags, colors)

## Custom Domain

To use a custom domain with GitHub Pages:

1. Go to **Settings > Pages** in this repo
2. Set source to `main` branch, root `/`
3. Add your custom domain
4. Create a `CNAME` DNS record pointing your domain to `msansoni.github.io`
5. Enable **Enforce HTTPS**
