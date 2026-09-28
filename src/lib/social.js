// Everything that talks to Firebase: accounts, friends and shared recipes.
//
// Loaded on demand (see account.jsx), so somebody who never opens Social never
// downloads any of it. Nothing here is trusted by the server — every rule that
// matters is enforced by firestore.rules; the checks in this file exist to give
// a clear message before the server would give a flat refusal.

import { initializeApp } from 'firebase/app'
import {
  initializeAuth,
  indexedDBLocalPersistence,
  browserLocalPersistence,
  connectAuthEmulator,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  reload,
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from 'firebase/auth'
import {
  initializeFirestore,
  connectFirestoreEmulator,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch,
  collection,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore'
import { activeConfig, useEmulator } from './firebase-config'
import { shrinkDataURL } from './image'

const app = initializeApp(activeConfig())

// Persistence without the popup/redirect machinery, which Mixly never uses and
// which would otherwise come along in the download.
export const auth = initializeAuth(app, {
  persistence: [indexedDBLocalPersistence, browserLocalPersistence],
})
const db = initializeFirestore(app, {})

if (useEmulator) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
}

/* ------------------------------------------------------------------ errors */

// Errors carry a short code the interface turns into a sentence.
class SocialError extends Error {
  constructor(code) {
    super(code)
    this.code = code
  }
}
const fail = (code) => {
  throw new SocialError(code)
}

// Firebase's own error codes, mapped onto the few that mean something to a
// person holding a phone.
export function errorCode(err) {
  if (err instanceof SocialError) return err.code
  const c = err?.code || ''
  if (c.includes('email-already-in-use')) return 'email-taken'
  if (c.includes('invalid-email')) return 'email-invalid'
  if (c.includes('weak-password')) return 'weak-password'
  if (c.includes('wrong-password') || c.includes('invalid-credential') || c.includes('user-not-found'))
    return 'wrong-login'
  if (c.includes('too-many-requests')) return 'too-many'
  if (c.includes('network') || c.includes('unavailable')) return 'offline'
  if (c.includes('requires-recent-login')) return 'relogin'
  return 'unknown'
}

/* ----------------------------------------------------------------- helpers */

export const USERNAME_RE = /^[A-Za-z0-9_.]{3,20}$/

// No 0/O, 1/I/L: a code gets read out loud and typed off a screenshot.
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

function newFriendCode() {
  const bytes = new Uint32Array(8)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('')
}

// "abcd-2345", "ABCD 2345", "abcd2345" all mean the same code.
export function normaliseCode(input) {
  return (input || '').toUpperCase().replace(/[^A-Z0-9]/g, '')
}

export function formatCode(code) {
  return code ? code.slice(0, 4) + '-' + code.slice(4) : ''
}

const looksLikeCode = (s) => /^[A-HJ-NP-Z2-9]{8}$/.test(s)

const pairId = (a, b) => (a < b ? `${a}_${b}` : `${b}_${a}`)

/* ------------------------------------------------------------------ account */

export function watchAuth(cb) {
  return onAuthStateChanged(auth, cb)
}

export async function isUsernameFree(username) {
  const snap = await getDoc(doc(db, 'usernames', username.toLowerCase()))
  return !snap.exists()
}

// Claim a username and a fresh friend code for the signed-in user, in one
// write. The rules only let the profile name what the same write claims, and
// only let a name be claimed while nobody holds it.
export async function claimProfile(username) {
  const user = auth.currentUser
  if (!user) fail('signed-out')
  if (!USERNAME_RE.test(username)) fail('username-invalid')
  if (!(await isUsernameFree(username))) fail('username-taken')

  let code = newFriendCode()
  // Thirty-one characters to the eighth power leaves a collision very unlikely,
  // but checking costs one read.
  for (let i = 0; i < 5; i++) {
    const taken = await getDoc(doc(db, 'friendCodes', code))
    if (!taken.exists()) break
    code = newFriendCode()
  }

  const profile = {
    username,
    usernameLower: username.toLowerCase(),
    friendCode: code,
    createdAt: Date.now(),
  }
  const batch = writeBatch(db)
  batch.set(doc(db, 'usernames', profile.usernameLower), { uid: user.uid })
  batch.set(doc(db, 'friendCodes', code), { uid: user.uid })
  batch.set(doc(db, 'profiles', user.uid), profile)
  try {
    await batch.commit()
  } catch {
    // Somebody took the name between the check and the write.
    fail('username-taken')
  }
  return profile
}

export async function signUp({ email, password, username, lang }) {
  if (!USERNAME_RE.test(username)) fail('username-invalid')
  if (!(await isUsernameFree(username))) fail('username-taken')
  auth.languageCode = lang || 'en'
  const { user } = await createUserWithEmailAndPassword(auth, email.trim(), password)
  try {
    const profile = await claimProfile(username)
    await sendEmailVerification(user)
    return profile
  } catch (err) {
    // An account without a profile would be stuck, so a failed claim takes
    // the account back out rather than leaving it half made.
    await deleteUser(user).catch(() => {})
    throw err
  }
}

export async function signIn({ email, password }) {
  await signInWithEmailAndPassword(auth, email.trim(), password)
}

export function signOut() {
  return fbSignOut(auth)
}

export async function resendVerification(lang) {
  if (!auth.currentUser) return
  auth.languageCode = lang || 'en'
  await sendEmailVerification(auth.currentUser)
}

export async function resetPassword(email, lang) {
  auth.languageCode = lang || 'en'
  await sendPasswordResetEmail(auth, email.trim())
}

// Asks the server whether the address has been confirmed since. The token is
// refreshed too, because that is what the database rules read.
export async function refreshUser() {
  if (!auth.currentUser) return null
  await reload(auth.currentUser)
  if (auth.currentUser.emailVerified) await auth.currentUser.getIdToken(true)
  return auth.currentUser
}

export async function getProfile(uid) {
  const snap = await getDoc(doc(db, 'profiles', uid))
  return snap.exists() ? { uid, ...snap.data() } : null
}

/* ------------------------------------------------------------------ friends */

const profileCache = new Map()
async function nameOf(uid) {
  if (!profileCache.has(uid)) {
    profileCache.set(uid, getProfile(uid).catch(() => null))
  }
  const p = await profileCache.get(uid)
  return p?.username || '?'
}

// Live list of friends: [{ uid, username, since }].
export function watchFriends(uid, cb) {
  const q = query(collection(db, 'friendships'), where('members', 'array-contains', uid))
  return onSnapshot(
    q,
    async (snap) => {
      const list = await Promise.all(
        snap.docs.map(async (d) => {
          const other = d.data().members.find((m) => m !== uid)
          return { uid: other, username: await nameOf(other), since: d.data().createdAt }
        }),
      )
      list.sort((a, b) => a.username.localeCompare(b.username))
      cb(list)
    },
    () => cb([]),
  )
}

// Live lists of requests to you and from you.
export function watchRequests(uid, cb) {
  let incoming = []
  let outgoing = []
  const emit = () => cb({ incoming, outgoing })
  const byNewest = (a, b) => b.createdAt - a.createdAt
  const unIn = onSnapshot(
    query(collection(db, 'requests'), where('to', '==', uid)),
    (snap) => {
      incoming = snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort(byNewest)
      emit()
    },
    () => {},
  )
  const unOut = onSnapshot(
    query(collection(db, 'requests'), where('from', '==', uid)),
    (snap) => {
      outgoing = snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort(byNewest)
      emit()
    },
    () => {},
  )
  return () => {
    unIn()
    unOut()
  }
}

// Find the person a username or a friend code belongs to.
async function findPerson(input) {
  const raw = (input || '').trim().replace(/^@/, '')
  if (!raw) fail('empty')
  const asCode = normaliseCode(raw)
  if (looksLikeCode(asCode)) {
    const snap = await getDoc(doc(db, 'friendCodes', asCode))
    if (snap.exists()) return snap.data().uid
  }
  if (USERNAME_RE.test(raw)) {
    const snap = await getDoc(doc(db, 'usernames', raw.toLowerCase()))
    if (snap.exists()) return snap.data().uid
  }
  return fail('not-found')
}

// Send a friend request. Returns what happened: 'sent', or 'accepted' when
// they had already asked you — saying yes is what both of you want then.
export async function sendRequest(me, input) {
  const them = await findPerson(input)
  if (them === me.uid) fail('self')

  const friendship = await getDoc(doc(db, 'friendships', pairId(me.uid, them))).catch(() => null)
  if (friendship?.exists()) fail('already-friends')

  const theirs = await getDoc(doc(db, 'requests', `${them}_${me.uid}`)).catch(() => null)
  if (theirs?.exists()) {
    await accept({ id: theirs.id, ...theirs.data() }, me.uid)
    return { result: 'accepted', username: theirs.data().fromName }
  }

  const mine = await getDoc(doc(db, 'requests', `${me.uid}_${them}`)).catch(() => null)
  if (mine?.exists()) fail('already-asked')

  const toName = await nameOf(them)
  await setDoc(doc(db, 'requests', `${me.uid}_${them}`), {
    from: me.uid,
    to: them,
    fromName: me.username,
    toName,
    createdAt: Date.now(),
  })
  return { result: 'sent', username: toName }
}

// Saying yes makes the friendship and clears the request in the same write.
export async function accept(request, myUid) {
  const [a, b] = [request.from, myUid].sort()
  const batch = writeBatch(db)
  batch.set(doc(db, 'friendships', `${a}_${b}`), { members: [a, b], createdAt: Date.now() })
  batch.delete(doc(db, 'requests', request.id))
  await batch.commit()
}

// Declining, and withdrawing your own, are both just removing the request.
export function dropRequest(request) {
  return deleteDoc(doc(db, 'requests', request.id))
}

export function removeFriend(myUid, friendUid) {
  return deleteDoc(doc(db, 'friendships', pairId(myUid, friendUid)))
}

/* ----------------------------------------------------------- shared recipes */

const shelf = (uid) => collection(db, 'users', uid, 'shared')

// What of a recipe goes to friends: the recipe itself, with its photo made
// small enough to travel inside the record.
async function toShared(recipe, owner) {
  return {
    owner: owner.uid,
    ownerName: owner.username,
    name: recipe.name,
    image: await shrinkDataURL(recipe.image),
    category: recipe.category || '',
    tags: recipe.tags || [],
    scenario: recipe.scenario || '',
    glass: recipe.glass || '',
    garnish: recipe.garnish || '',
    ingredients: recipe.ingredients || [],
    instructions: recipe.instructions || [],
    createdAt: recipe.createdAt || Date.now(),
    updatedAt: recipe.updatedAt || recipe.createdAt || Date.now(),
  }
}

// Make what friends see match what is marked to share on this phone: put up
// anything new or changed, take down anything deleted or made private. The
// phone is the source of truth; the shelf online is a copy of part of it.
export async function syncShared(owner, recipes) {
  const wanted = new Map(recipes.filter((r) => r.shared).map((r) => [r.id, r]))
  const snap = await getDocs(shelf(owner.uid))
  const online = new Map(snap.docs.map((d) => [d.id, d.data()]))

  const jobs = []
  for (const [id, recipe] of wanted) {
    const there = online.get(id)
    const stamp = recipe.updatedAt || recipe.createdAt || 0
    if (!there || (there.updatedAt || 0) < stamp || there.ownerName !== owner.username) {
      jobs.push(toShared(recipe, owner).then((data) => setDoc(doc(shelf(owner.uid), id), data)))
    }
  }
  for (const id of online.keys()) {
    if (!wanted.has(id)) jobs.push(deleteDoc(doc(shelf(owner.uid), id)))
  }
  await Promise.all(jobs)
  return jobs.length
}

// Everything one friend has shared, newest first.
export async function friendShelf(friendUid) {
  const snap = await getDocs(shelf(friendUid))
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
}

export async function sharedRecipe(ownerUid, id) {
  const snap = await getDoc(doc(shelf(ownerUid), id))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

/* ------------------------------------------------------------ closing down */

// Remove everything this account put online, then the account itself. Asks
// for the password again first: Firebase only deletes an account whose owner
// has just proved it is them.
export async function deleteAccount(password) {
  const user = auth.currentUser
  if (!user) return
  await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password))

  const uid = user.uid
  const profile = await getProfile(uid)
  const jobs = []

  const mine = await getDocs(shelf(uid)).catch(() => null)
  mine?.docs.forEach((d) => jobs.push(deleteDoc(d.ref)))

  if (user.emailVerified) {
    const [inc, out, fr] = await Promise.all([
      getDocs(query(collection(db, 'requests'), where('to', '==', uid))),
      getDocs(query(collection(db, 'requests'), where('from', '==', uid))),
      getDocs(query(collection(db, 'friendships'), where('members', 'array-contains', uid))),
    ]).catch(() => [null, null, null])
    ;[inc, out, fr].forEach((s) => s?.docs.forEach((d) => jobs.push(deleteDoc(d.ref))))
  }
  await Promise.all(jobs)

  if (profile) {
    const batch = writeBatch(db)
    batch.delete(doc(db, 'usernames', profile.usernameLower))
    batch.delete(doc(db, 'friendCodes', profile.friendCode))
    batch.delete(doc(db, 'profiles', uid))
    await batch.commit()
  }
  await deleteUser(user)
}
