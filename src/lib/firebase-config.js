// The Firebase project Mixly's social side talks to.
//
// Paste the object from Firebase → Project settings → Your apps → the web app
// here. None of these values are secret — a Firebase web app is meant to ship
// them — because what keeps the data safe is firestore.rules, not this file.
//
// While this is null the social side stays out of sight entirely: no Social
// tab, no profile in Settings, no share switch on a recipe. Everything else
// works exactly as before.
export const firebaseConfig = null

// Built with VITE_FIREBASE_EMULATOR=1, the app talks to a local Firebase
// emulator instead, which is how all of this is tested without touching the
// real project.
export const useEmulator = import.meta.env.VITE_FIREBASE_EMULATOR === '1'

const emulatorConfig = {
  apiKey: 'demo-key',
  authDomain: 'demo-mixly.firebaseapp.com',
  projectId: 'demo-mixly',
  appId: 'demo-app',
}

export function activeConfig() {
  return useEmulator ? emulatorConfig : firebaseConfig
}

export function socialConfigured() {
  return !!activeConfig()
}
