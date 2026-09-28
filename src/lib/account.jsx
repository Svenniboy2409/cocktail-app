import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { socialConfigured } from './firebase-config'
import { getUserRecipes } from './storage'

// The signed-in person, their friends and their requests, for the whole app.
//
// Firebase is a large download, so it is not part of the app's first load:
// the provider fetches it the first time something asks — the Social tab, the
// profile in Settings — or straight away, but only after the page has
// settled, on a phone that has been signed in before.

const AccountContext = createContext(null)

// Remembered across launches, so a returning user's profile can be shown the
// moment the app opens and the download started without waiting to be asked.
const HINT_KEY = 'mixly.account.v1'
const readHint = () => {
  try {
    return JSON.parse(localStorage.getItem(HINT_KEY)) || null
  } catch {
    return null
  }
}
const writeHint = (v) => {
  try {
    if (v) localStorage.setItem(HINT_KEY, JSON.stringify(v))
    else localStorage.removeItem(HINT_KEY)
  } catch {
    /* storage blocked: nothing to remember with */
  }
}

let loader = null
const loadSocial = () => (loader ||= import('./social'))

export function AccountProvider({ children }) {
  const configured = socialConfigured()
  const hint = configured ? readHint() : null

  // 'off'        social is not set up in this build
  // 'idle'       not loaded yet
  // 'loading'    downloading and asking Firebase who this is
  // 'signedOut'  nobody is signed in
  // 'noProfile'  signed in with Google, but no username chosen yet
  // 'ready'      everything works
  const [status, setStatus] = useState(configured ? (hint ? 'loading' : 'idle') : 'off')
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(hint?.profile || null)
  const [friends, setFriends] = useState([])
  const [requests, setRequests] = useState({ incoming: [], outgoing: [] })
  const [api, setApi] = useState(null)
  const started = useRef(false)
  const claimedFor = useRef(null)

  const start = useCallback(() => {
    if (!configured || started.current) return
    started.current = true
    setStatus((s) => (s === 'idle' ? 'loading' : s))
    loadSocial().then((mod) => {
      setApi(mod)
      mod.watchAuth(async (u) => {
        setUser(u)
        if (!u) {
          setProfile(null)
          writeHint(null)
          setStatus('signedOut')
          return
        }
        const p = await mod.getProfile(u.uid).catch(() => null)
        // Asked before the sign-up had finished writing the profile; the
        // answer is out of date, and claimed() has already said so.
        if (!p && claimedFor.current === u.uid) return
        setProfile(p)
        if (!p) {
          setStatus('noProfile')
          return
        }
        writeHint({ profile: p })
        setStatus('ready')
      })
    })
  }, [configured])

  // A phone that was signed in last time starts the download once the page is
  // idle, so shared recipes stay in step without the user doing anything.
  useEffect(() => {
    if (!hint) return undefined
    const go = () => start()
    const id = window.requestIdleCallback ? window.requestIdleCallback(go, { timeout: 2500 }) : setTimeout(go, 1200)
    return () => (window.cancelIdleCallback ? window.cancelIdleCallback(id) : clearTimeout(id))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Friends and requests, live, once the account is fully usable.
  useEffect(() => {
    if (status !== 'ready' || !api || !user) return undefined
    const a = api.watchFriends(user.uid, setFriends)
    const b = api.watchRequests(user.uid, setRequests)
    return () => {
      a()
      b()
      setFriends([])
      setRequests({ incoming: [], outgoing: [] })
    }
  }, [status, api, user])

  // Keep what friends can see in step with the recipes on this phone: once on
  // arrival, and after every change to them.
  useEffect(() => {
    if (status !== 'ready' || !api || !profile || !user) return undefined
    let timer
    let running = false
    let again = false
    const owner = { uid: user.uid, username: profile.username, displayName: profile.displayName || profile.username }
    const run = async () => {
      if (running) {
        again = true
        return
      }
      running = true
      try {
        await api.syncShared(owner, await getUserRecipes())
      } catch {
        /* offline or refused — the next change or launch tries again */
      }
      running = false
      if (again) {
        again = false
        run()
      }
    }
    const soon = () => {
      clearTimeout(timer)
      timer = setTimeout(run, 600)
    }
    run()
    window.addEventListener('mixly:recipes-changed', soon)
    window.addEventListener('online', soon)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('mixly:recipes-changed', soon)
      window.removeEventListener('online', soon)
    }
  }, [status, api, profile, user])

  const value = useMemo(
    () => ({
      configured,
      status,
      user,
      profile,
      friends,
      requests,
      api,
      start,
      // Called once a profile has been made or changed, so the screen follows
      // without waiting for another round trip.
      claimed: (p) => {
        claimedFor.current = api?.auth.currentUser?.uid || null
        setProfile(p)
        writeHint({ profile: p })
        setStatus('ready')
      },
      me:
        user && profile
          ? { uid: user.uid, username: profile.username, displayName: profile.displayName || profile.username }
          : null,
    }),
    [configured, status, user, profile, friends, requests, api, start],
  )

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>
}

// The account, loading Firebase if it has not been yet.
export function useAccount({ load = true } = {}) {
  const ctx = useContext(AccountContext)
  useEffect(() => {
    if (load) ctx.start()
  }, [load, ctx])
  return ctx
}
