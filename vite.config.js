import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The `base` must match your GitHub repo name so assets resolve under
// https://<user>.github.io/<repo>/ . Change 'cocktail-app' if your repo
// has a different name. Locally (dev) it is served from '/'.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/cocktail-app/' : '/',
  plugins: [react()],
}))
