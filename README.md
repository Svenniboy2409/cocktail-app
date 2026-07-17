# 🍸 Mixly — Cocktail Collection

A mobile-friendly web app to browse popular cocktails, save your favourites, and
craft your own recipes with photos. Built with **React + Vite**, designed for a
dark, moody bar vibe, and deployable to **GitHub Pages**.

## Features

- **Discover** ~30 popular cocktails with photos, ingredients, a "when to serve"
  scenario, and a step-by-step recipe.
- **Save** any cocktail to your personal **Library**.
- **Create your own recipes** through a friendly, TikTok-style **big + button** —
  upload a photo, add ingredients and steps, and pick when it's the perfect pour.
- Everything you add is stored **locally in your browser** (no account needed).
- **Export / import** your data as a JSON backup.

## Run locally

```bash
npm install
npm run dev
```

Then open the printed URL (usually http://localhost:5173).

## Deploy to GitHub Pages

1. Create a **new GitHub repository** (e.g. `cocktail-app`).
2. If your repo name is **not** `cocktail-app`, open `vite.config.js` and change
   the `base` value to `'/<your-repo-name>/'`.
3. Push this project to the repo's `main` branch:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/<you>/<your-repo-name>.git
   git push -u origin main
   ```
4. In the repo, go to **Settings → Pages → Build and deployment → Source** and
   select **GitHub Actions**.
5. The included workflow (`.github/workflows/deploy.yml`) builds and publishes the
   site automatically on every push. Your app will be live at
   `https://<you>.github.io/<your-repo-name>/`.

## Tech notes

- **Routing:** `HashRouter`, so deep links and page refreshes work on GitHub Pages.
- **Storage:** saved cocktails in `localStorage`; custom recipes + images in
  IndexedDB (images are compressed on upload).
- **Data:** curated cocktail set in `src/data/cocktails.js`; images are served
  from TheCocktailDB.
