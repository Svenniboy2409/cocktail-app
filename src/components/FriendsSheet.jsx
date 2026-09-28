import { useState } from 'react'
import { useDismissableSheet } from '../lib/hooks'
import { useAccount } from '../lib/account'
import { useI18n } from '../lib/i18n'
import { useToast } from './Toast'
import { useSocialError } from './ProfileSection'
import { IconCopy, IconShare } from './icons'

// A link that opens Mixly with your code already filled in on the other side.
function inviteLink(code) {
  const { origin, pathname } = window.location
  return `${origin}${pathname}#/social?add=${code}`
}

// Adding friends, and everything around it: your own name and code for others
// to find you by, the requests you have sent, and the friends you have.
export default function FriendsSheet({ onClose, prefill = '' }) {
  const account = useAccount()
  const { t } = useI18n()
  const showToast = useToast()
  const explain = useSocialError()
  const { sheetRef, handleProps, sheetStyle, backdropStyle } = useDismissableSheet(onClose)
  const [input, setInput] = useState(prefill)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [busy, setBusy] = useState(false)
  const { profile, friends, requests, api, me } = account
  const code = api && profile ? api.formatCode(profile.friendCode) : ''

  const add = async (e) => {
    e.preventDefault()
    setError('')
    setOk('')
    setBusy(true)
    try {
      const res = await api.sendRequest(me, input)
      setInput('')
      setOk(
        res.result === 'accepted'
          ? t('@{name} had already asked you — you are now friends.', { name: res.username })
          : t('Request sent to @{name}. You will see their cocktails once they accept.', {
              name: res.username,
            }),
      )
    } catch (err) {
      setError(explain(err))
    }
    setBusy(false)
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      showToast(t('Friend code copied'))
    } catch {
      /* no clipboard: the code is on screen */
    }
  }

  // The share sheet where there is one (every phone), the clipboard otherwise.
  const share = async () => {
    const text = t('Add me on Mixly: @{name}, friend code {code}', { name: profile.username, code })
    const url = inviteLink(profile.friendCode)
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Mixly', text, url })
      } else {
        await navigator.clipboard.writeText(`${text}\n${url}`)
        showToast(t('Invite link copied'))
      }
    } catch {
      /* closed the share sheet: nothing to do */
    }
  }

  const remove = async (f) => {
    if (!window.confirm(t('Remove @{name} as a friend? You will no longer see each other’s cocktails.', { name: f.username })))
      return
    try {
      await api.removeFriend(me.uid, f.uid)
      showToast(t('@{name} removed', { name: f.username }))
    } catch (err) {
      showToast(explain(err))
    }
  }

  const withdraw = async (r) => {
    try {
      await api.dropRequest(r)
    } catch (err) {
      showToast(explain(err))
    }
  }

  return (
    <>
      <div className="sheet-backdrop" style={backdropStyle} onClick={onClose} />
      <div
        className="sheet"
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={t('Friends')}
        style={sheetStyle}
      >
        <div className="sheet-handle" {...handleProps}>
          <div className="sheet-grip" />
          <div className="sheet-head">
            <h2>{t('Friends')}</h2>
            <button className="sheet-close" onClick={onClose} onPointerDown={(e) => e.stopPropagation()}>
              {t('Done')}
            </button>
          </div>
        </div>

        <div className="sheet-body">
          <div className="field">
            <label>{t('Add a friend')}</label>
            <form className="add-friend-row" onSubmit={add}>
              <input
                className="input"
                placeholder={t('Username or friend code')}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <button className="btn btn-primary" type="submit" disabled={busy || !input.trim() || !api}>
                {t('Send')}
              </button>
            </form>
            {error && <div className="field-error">{error}</div>}
            {ok && <div className="field-ok">{ok}</div>}
            <p className="muted" style={{ margin: '10px 2px 0', fontSize: 13 }}>
              {t('They get a request, and you see each other’s shared cocktails once they accept.')}
            </p>
          </div>

          {profile && (
            <div className="field">
              <label>{t('So friends can find you')}</label>
              <div className="me-card">
                <div className="profile-card">
                  <div className="profile-avatar">{profile.username.slice(0, 1).toUpperCase()}</div>
                  <div className="profile-text">
                    <div className="profile-name">@{profile.username}</div>
                    <div className="profile-meta">{t('Your username')}</div>
                  </div>
                </div>
                <button className="code-row" onClick={copy}>
                  <span className="code-label">{t('Your friend code')}</span>
                  <span className="code-value">{code}</span>
                  <IconCopy />
                </button>
                <button className="btn btn-block" onClick={share}>
                  <IconShare /> {t('Share your code')}
                </button>
              </div>
            </div>
          )}

          {requests.outgoing.length > 0 && (
            <div className="field">
              <label>{t('Waiting for an answer')}</label>
              <div className="friend-list">
                {requests.outgoing.map((r) => (
                  <div className="friend-row" key={r.id}>
                    <div className="profile-avatar sm">{r.toName.slice(0, 1).toUpperCase()}</div>
                    <div className="friend-row-name">
                      @{r.toName}
                      <small>{t('Request sent')}</small>
                    </div>
                    <button className="btn" onClick={() => withdraw(r)}>
                      {t('Withdraw')}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="field" style={{ marginBottom: 0 }}>
            <label>
              {t('Your friends')} <span className="hint">{friends.length || ''}</span>
            </label>
            {friends.length === 0 ? (
              <p className="muted" style={{ margin: '0 2px', fontSize: 14 }}>
                {t('No friends yet. Send a request, or share your code so others can send you one.')}
              </p>
            ) : (
              <div className="friend-list">
                {friends.map((f) => (
                  <div className="friend-row" key={f.uid}>
                    <div className="profile-avatar sm">{f.username.slice(0, 1).toUpperCase()}</div>
                    <div className="friend-row-name">@{f.username}</div>
                    <button className="btn" onClick={() => remove(f)}>
                      {t('Remove')}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
