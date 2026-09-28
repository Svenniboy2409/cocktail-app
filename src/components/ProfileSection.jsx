import { useEffect, useState } from 'react'
import { useAccount } from '../lib/account'
import { useI18n } from '../lib/i18n'
import { useToast } from './Toast'
import { IconCopy, IconEdit } from './icons'

// What each error means to someone holding a phone.
export const SOCIAL_ERRORS = {
  'username-invalid': '3 to 20 letters, digits, dots or underscores.',
  'username-taken': 'That username is already taken.',
  'display-name-empty': 'Enter the name friends will see.',
  cancelled: 'Signing in was cancelled.',
  'popup-blocked': 'Your browser blocked the Google window. Allow pop-ups for this site and try again.',
  'wrong-google': 'That is a different Google account from the one you signed in with.',
  unsupported: 'Signing in with Google does not work in this browser. Try Safari or Chrome.',
  'too-many': 'Too many attempts. Wait a moment and try again.',
  offline: 'No connection. Check your internet and try again.',
  relogin: 'For your safety, log out and in again first.',
  'not-found': 'Nobody found with that username or friend code.',
  self: 'That is you.',
  'already-friends': 'You are already friends.',
  'already-asked': 'You have already sent a request.',
  empty: 'Enter a username or friend code.',
  unknown: 'Something went wrong. Try again.',
}

export function useSocialError() {
  const { t } = useI18n()
  const account = useAccount({ load: false })
  return (err) => t(SOCIAL_ERRORS[account.api?.errorCode(err) || 'unknown'] || SOCIAL_ERRORS.unknown)
}

// The top of Settings: who you are on Mixly, or how to become someone.
export default function ProfileSection() {
  const account = useAccount()
  const { t } = useI18n()

  if (account.status === 'off') return null

  return (
    <div className="field profile-field">
      <label>{t('Profile')}</label>
      {account.status === 'idle' || account.status === 'loading' ? (
        <div className="profile-card is-loading">
          <div className="profile-avatar" />
          <div className="profile-text">
            <div className="profile-name">{account.profile?.displayName || '…'}</div>
            <div className="profile-meta">{t('Loading your profile…')}</div>
          </div>
        </div>
      ) : account.status === 'signedOut' ? (
        <SignIn />
      ) : account.status === 'noProfile' ? (
        <NamesForm mode="create" />
      ) : (
        <SignedIn />
      )}
    </div>
  )
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  )
}

/* ------------------------------------------------------------ signed out */

function SignIn() {
  const account = useAccount()
  const { t, lang } = useI18n()
  const explain = useSocialError()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const go = async () => {
    setError('')
    setBusy(true)
    try {
      await account.api.signInWithGoogle(lang)
    } catch (err) {
      // Kept in the console: when sign-in fails on someone's phone, the code
      // there is what says why.
      console.warn('Google sign-in failed:', err?.code || err)
      if (account.api.errorCode(err) !== 'cancelled') setError(explain(err))
    }
    setBusy(false)
  }

  return (
    <div className="profile-intro">
      <p>{t('Make a profile to share your own cocktails with friends and see theirs in Social.')}</p>
      <button className="btn btn-google btn-block" onClick={go} disabled={busy || !account.api}>
        <GoogleMark /> {busy ? t('One moment…') : t('Continue with Google')}
      </button>
      {error && <div className="field-error">{error}</div>}
      <p className="muted auth-small" style={{ marginTop: 12 }}>
        {t('New here? After signing in you choose the name friends see. Been here before? You are straight back in, on any phone.')}
      </p>
    </div>
  )
}

/* ------------------------------------------ choosing or changing your names */

// Used twice: right after the first Google sign-in, to make the profile, and
// later from "Edit profile", to change it.
function NamesForm({ mode, onDone }) {
  const account = useAccount()
  const { t } = useI18n()
  const explain = useSocialError()
  const showToast = useToast()
  const current = account.profile
  const [displayName, setDisplayName] = useState(
    () => current?.displayName || account.api?.googleName() || '',
  )
  const [username, setUsername] = useState(() => current?.username || '')
  const [nameState, setNameState] = useState(mode === 'edit' ? 'mine' : null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  // Tell people whether a name is free while they are still typing it. Their
  // own current name counts as free.
  useEffect(() => {
    if (!account.api || !username) {
      setNameState(null)
      return undefined
    }
    if (!account.api.USERNAME_RE.test(username)) {
      setNameState('invalid')
      return undefined
    }
    if (current && username.toLowerCase() === current.usernameLower) {
      setNameState('mine')
      return undefined
    }
    setNameState('checking')
    let live = true
    const id = setTimeout(() => {
      account.api
        .isUsernameFree(username)
        .then((free) => live && setNameState(free ? 'free' : 'taken'))
        .catch(() => live && setNameState(null))
    }, 350)
    return () => {
      live = false
      clearTimeout(id)
    }
  }, [username, account.api, current])

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      if (mode === 'create') {
        account.claimed(await account.api.claimProfile(username, displayName))
        showToast(t('Welcome to Social, {name}', { name: account.api.cleanDisplayName(displayName) }))
      } else {
        account.claimed(await account.api.updateProfile(current, { username, displayName }))
        showToast(t('Profile updated'))
        onDone?.()
      }
    } catch (err) {
      setError(explain(err))
      setBusy(false)
    }
  }

  const unchanged =
    mode === 'edit' &&
    displayName.trim() === current?.displayName &&
    username === current?.username

  return (
    <form className="auth-form" onSubmit={submit}>
      {mode === 'create' && (
        <p className="muted auth-small" style={{ marginTop: 0 }}>
          {t('Signed in with Google as {email}. One more step: how should friends know you?', {
            email: account.user?.email,
          })}
        </p>
      )}

      <div className="auth-row">
        <span className="auth-label">{t('Display name')}</span>
        <input
          className="input"
          maxLength={40}
          autoComplete="name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
        <span className="auth-note">{t('Shown on the cocktails you share.')}</span>
      </div>

      <div className="auth-row">
        <span className="auth-label">{t('Username')}</span>
        <div className="input-at">
          <span>@</span>
          <input
            className="input"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck="false"
            autoComplete="username"
            maxLength={20}
            value={username}
            onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))}
          />
        </div>
        <span className={'auth-note ' + (nameState || '')}>
          {nameState === 'free'
            ? t('Available')
            : nameState === 'taken'
              ? t('That username is already taken.')
              : nameState === 'invalid'
                ? t('3 to 20 letters, digits, dots or underscores.')
                : nameState === 'checking'
                  ? t('Checking…')
                  : t('Friends can add you by this name. You can change it later.')}
        </span>
      </div>

      {error && <div className="field-error">{error}</div>}

      <div className="profile-actions">
        {mode === 'edit' && (
          <button type="button" className="btn" onClick={onDone}>
            {t('Cancel')}
          </button>
        )}
        <button
          className="btn btn-primary"
          type="submit"
          disabled={
            busy ||
            unchanged ||
            !displayName.trim() ||
            !(nameState === 'free' || nameState === 'mine')
          }
        >
          {busy ? t('One moment…') : t(mode === 'create' ? 'Create profile' : 'Save')}
        </button>
      </div>

      {mode === 'create' && (
        <button type="button" className="text-link auth-forgot" onClick={() => account.api.signOut()}>
          {t('Use a different Google account')}
        </button>
      )}
    </form>
  )
}

/* ------------------------------------------------------------ signed in */

function SignedIn() {
  const account = useAccount()
  const { t } = useI18n()
  const showToast = useToast()
  const explain = useSocialError()
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const { profile, user } = account
  if (!profile) return null

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(account.api.formatCode(profile.friendCode))
      showToast(t('Friend code copied'))
    } catch {
      /* no clipboard: the code is on screen to read out */
    }
  }

  const remove = async () => {
    setBusy(true)
    setError('')
    try {
      await account.api.deleteAccount()
      showToast(t('Your account has been deleted'))
    } catch (err) {
      if (account.api.errorCode(err) !== 'cancelled') setError(explain(err))
      setBusy(false)
    }
  }

  if (editing) return <NamesForm mode="edit" onDone={() => setEditing(false)} />

  return (
    <div className="profile-block">
      <div className="profile-card">
        <div className="profile-avatar">{(profile.displayName || profile.username).slice(0, 1).toUpperCase()}</div>
        <div className="profile-text">
          <div className="profile-name">{profile.displayName || profile.username}</div>
          <div className="profile-meta">@{profile.username}</div>
          <div className="profile-meta">{user?.email}</div>
        </div>
        <button
          className="header-action icon-only profile-edit"
          onClick={() => setEditing(true)}
          aria-label={t('Edit profile')}
          title={t('Edit profile')}
        >
          <IconEdit />
        </button>
      </div>

      <button className="code-row" onClick={copyCode}>
        <span className="code-label">{t('Your friend code')}</span>
        <span className="code-value">{account.api?.formatCode(profile.friendCode)}</span>
        <IconCopy />
      </button>

      <div className="profile-actions">
        <button className="btn" onClick={() => account.api.signOut()}>
          {t('Log out')}
        </button>
        <button className="btn btn-danger" onClick={() => setConfirmDelete((v) => !v)}>
          {t('Delete account')}
        </button>
      </div>

      {confirmDelete && (
        <div className="danger-box">
          <p>
            {t('This removes your profile, your friends and everything you shared. Your recipes stay on this phone. Google asks you to confirm it is you.')}
          </p>
          {error && <div className="field-error">{error}</div>}
          <button className="btn btn-danger btn-block" disabled={busy} onClick={remove}>
            {busy ? t('One moment…') : t('Delete my account for good')}
          </button>
        </div>
      )}
    </div>
  )
}
