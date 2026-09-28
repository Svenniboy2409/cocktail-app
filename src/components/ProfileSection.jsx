import { useEffect, useState } from 'react'
import { useAccount } from '../lib/account'
import { useI18n } from '../lib/i18n'
import { useToast } from './Toast'
import { IconCheck, IconCopy, IconMail } from './icons'

// What each error means to someone holding a phone.
export const SOCIAL_ERRORS = {
  'username-invalid': '3 to 20 letters, digits, dots or underscores.',
  'username-taken': 'That username is already taken.',
  'email-taken': 'There is already an account with this email address. Log in instead.',
  'email-invalid': 'That does not look like an email address.',
  'weak-password': 'Use at least 6 characters for your password.',
  'wrong-login': 'Email address or password is not right.',
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
            <div className="profile-name">{account.profile ? '@' + account.profile.username : '…'}</div>
            <div className="profile-meta">{t('Loading your profile…')}</div>
          </div>
        </div>
      ) : account.status === 'signedOut' ? (
        <AuthForms />
      ) : account.status === 'noProfile' ? (
        <ChooseUsername />
      ) : (
        <SignedIn />
      )}
    </div>
  )
}

function Avatar({ name }) {
  return <div className="profile-avatar">{(name || '?').slice(0, 1).toUpperCase()}</div>
}

/* ------------------------------------------------------------ signed out */

function AuthForms() {
  const account = useAccount()
  const { t, lang } = useI18n()
  const explain = useSocialError()
  const showToast = useToast()
  const [mode, setMode] = useState(null) // null | 'signup' | 'signin'
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [nameState, setNameState] = useState(null) // null | 'checking' | 'free' | 'taken' | 'invalid'

  // Tell people whether a name is free while they are still typing it.
  useEffect(() => {
    if (mode !== 'signup' || !account.api || !username) {
      setNameState(null)
      return undefined
    }
    if (!account.api.USERNAME_RE.test(username)) {
      setNameState('invalid')
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
  }, [username, mode, account.api])

  if (!mode) {
    return (
      <div className="profile-intro">
        <p>
          {t('Make a profile to share your own cocktails with friends and see theirs in Social.')}
        </p>
        <div className="profile-intro-actions">
          <button className="btn btn-primary" onClick={() => setMode('signup')}>
            {t('Create profile')}
          </button>
          <button className="btn" onClick={() => setMode('signin')}>
            {t('Log in')}
          </button>
        </div>
      </div>
    )
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!account.api) return
    setError('')
    setBusy(true)
    try {
      if (mode === 'signup') {
        const profile = await account.api.signUp({ email, password, username, lang })
        account.claimed(profile)
        showToast(t('Profile created — check your email'))
      } else {
        await account.api.signIn({ email, password })
      }
    } catch (err) {
      setError(explain(err))
      setBusy(false)
    }
  }

  const forgot = async () => {
    if (!email.trim()) {
      setError(t('Enter your email address first.'))
      return
    }
    try {
      await account.api.resetPassword(email, lang)
      setError('')
      showToast(t('We sent you an email to reset your password'))
    } catch (err) {
      setError(explain(err))
    }
  }

  return (
    <form className="auth-form" onSubmit={submit}>
      <div className="seg auth-switch">
        {['signup', 'signin'].map((m) => (
          <button
            type="button"
            key={m}
            className={'seg-option' + (mode === m ? ' on' : '')}
            onClick={() => {
              setMode(m)
              setError('')
            }}
          >
            {t(m === 'signup' ? 'Create profile' : 'Log in')}
          </button>
        ))}
      </div>

      {mode === 'signup' && (
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
                    : t('Friends find you by this name. It cannot be changed later.')}
          </span>
        </div>
      )}

      <div className="auth-row">
        <span className="auth-label">{t('Email address')}</span>
        <input
          className="input"
          type="email"
          inputMode="email"
          autoCapitalize="none"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="auth-row">
        <span className="auth-label">{t('Password')}</span>
        <input
          className="input"
          type="password"
          autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {mode === 'signin' && (
          <button type="button" className="text-link auth-forgot" onClick={forgot}>
            {t('Forgot your password?')}
          </button>
        )}
      </div>

      {error && <div className="field-error">{error}</div>}

      <button
        className="btn btn-primary btn-block"
        type="submit"
        disabled={
          busy ||
          !account.api ||
          !email ||
          !password ||
          (mode === 'signup' && nameState !== 'free')
        }
      >
        {busy ? t('One moment…') : t(mode === 'signup' ? 'Create profile' : 'Log in')}
      </button>
      {mode === 'signup' && (
        <p className="muted auth-small">
          {t('We send you an email to confirm your address, so you can always get back into your account.')}
        </p>
      )}
    </form>
  )
}

/* ------------------------------------- signed in, sign-up was cut short */

function ChooseUsername() {
  const account = useAccount()
  const { t } = useI18n()
  const explain = useSocialError()
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      account.claimed(await account.api.claimProfile(username))
    } catch (err) {
      setError(explain(err))
      setBusy(false)
    }
  }

  return (
    <form className="auth-form" onSubmit={submit}>
      <p className="muted auth-small" style={{ marginTop: 0 }}>
        {t('Choose the username friends will know you by.')}
      </p>
      <div className="input-at">
        <span>@</span>
        <input
          className="input"
          autoCapitalize="none"
          autoCorrect="off"
          maxLength={20}
          value={username}
          onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))}
        />
      </div>
      {error && <div className="field-error">{error}</div>}
      <button className="btn btn-primary btn-block" disabled={busy || !username} type="submit">
        {t('Save username')}
      </button>
      <button type="button" className="text-link auth-forgot" onClick={() => account.api.signOut()}>
        {t('Log out')}
      </button>
    </form>
  )
}

/* ------------------------------------------------------------ signed in */

function SignedIn() {
  const account = useAccount()
  const { t, lang } = useI18n()
  const showToast = useToast()
  const explain = useSocialError()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const { profile, user, status } = account
  if (!profile) return null

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(account.api.formatCode(profile.friendCode))
      showToast(t('Friend code copied'))
    } catch {
      /* no clipboard: the code is on screen to read out */
    }
  }

  const resend = async () => {
    try {
      await account.api.resendVerification(lang)
      showToast(t('Email sent'))
    } catch (err) {
      showToast(explain(err))
    }
  }

  const checkAgain = async () => {
    await account.recheck()
    if (account.api?.auth.currentUser?.emailVerified) showToast(t('Email address confirmed'))
    else showToast(t('Not confirmed yet — open the link in the email first'))
  }

  const remove = async () => {
    setBusy(true)
    setError('')
    try {
      await account.api.deleteAccount(password)
      showToast(t('Your account has been deleted'))
    } catch (err) {
      setError(explain(err))
      setBusy(false)
    }
  }

  return (
    <div className="profile-block">
      <div className="profile-card">
        <Avatar name={profile.username} />
        <div className="profile-text">
          <div className="profile-name">@{profile.username}</div>
          <div className="profile-meta">
            {user?.email}
            {status === 'ready' && (
              <span className="profile-verified" title={t('Email address confirmed')}>
                <IconCheck width="14" height="14" />
              </span>
            )}
          </div>
        </div>
      </div>

      {status === 'unverified' ? (
        <div className="notice">
          <IconMail />
          <div>
            <strong>{t('Confirm your email address')}</strong>
            <p>
              {t('We sent a link to {email}. Open it, then come back here — Social unlocks once your address is confirmed.', {
                email: user?.email,
              })}
            </p>
            <div className="notice-actions">
              <button className="btn btn-primary" onClick={checkAgain}>
                {t('I have confirmed it')}
              </button>
              <button className="btn" onClick={resend}>
                {t('Send again')}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button className="code-row" onClick={copyCode}>
          <span className="code-label">{t('Your friend code')}</span>
          <span className="code-value">{account.api?.formatCode(profile.friendCode)}</span>
          <IconCopy />
        </button>
      )}

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
            {t('This removes your profile, your friends and everything you shared. Your recipes stay on this phone. Enter your password to confirm.')}
          </p>
          <input
            className="input"
            type="password"
            autoComplete="current-password"
            placeholder={t('Password')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <div className="field-error">{error}</div>}
          <button className="btn btn-danger btn-block" disabled={busy || !password} onClick={remove}>
            {busy ? t('One moment…') : t('Delete my account for good')}
          </button>
        </div>
      )}
    </div>
  )
}
