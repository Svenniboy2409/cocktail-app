import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAccount } from '../lib/account'
import { useI18n } from '../lib/i18n'
import { useToast } from '../components/Toast'
import CocktailCard from '../components/CocktailCard'
import FriendsSheet from '../components/FriendsSheet'
import SettingsSheet from '../components/SettingsSheet'
import { useSocialError } from '../components/ProfileSection'
import { IconUserPlus, IconCheck } from '../components/icons'

// What friends have shared, kept between visits so coming back to the tab
// shows the last list at once while a fresh one loads.
let feedCache = []

// Everything the friends you have shared, newest first.
async function loadFeed(api, friends) {
  const shelves = await Promise.all(
    friends.map((f) =>
      api
        .friendShelf(f.uid)
        // The name as the friend has it now, whatever it was when they shared.
        .then((items) => items.map((c) => ({ ...c, owner: f.uid, ownerName: f.displayName, ownerUsername: f.username })))
        .catch(() => []),
    ),
  )
  return shelves.flat().sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
}

// Handed to the detail page so a tapped card opens without a second fetch.
export function cachedShared(owner, id) {
  return feedCache.find((c) => c.owner === owner && c.id === id) || null
}

export default function Social() {
  const account = useAccount()
  const { t } = useI18n()
  const [params, setParams] = useSearchParams()
  const [friendsOpen, setFriendsOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [prefill, setPrefill] = useState('')
  const { status, friends, requests, api } = account

  // Opened from an invite link: straight to adding that person, once there is
  // an account to add them from.
  const addCode = params.get('add')
  useEffect(() => {
    if (!addCode || status !== 'ready') return
    setPrefill(addCode)
    setFriendsOpen(true)
    setParams({}, { replace: true })
  }, [addCode, status, setParams])

  return (
    <div className="page">
      <header className="app-header library-header social-header">
        <div className="header-row">
          <div className="eyebrow">{t('Your friends')}</div>
          {status === 'ready' && (
            <div className="header-actions">
              <button className="header-action" onClick={() => setFriendsOpen(true)}>
                <IconUserPlus />
                <span>{t('Add friends')}</span>
              </button>
            </div>
          )}
        </div>
        <h1>{t('Social')}</h1>
        <div className="sub">{t('Cocktails your friends have created')}</div>
      </header>

      {status === 'idle' || status === 'loading' ? (
        <p className="social-count">{t('Loading…')}</p>
      ) : status === 'signedOut' || status === 'noProfile' ? (
        <div className="social-gate">
          <div className="icon">🥂</div>
          <h3>{t('Share cocktails with friends')}</h3>
          <p>
            {t('Make a profile to see what your friends have created, and to share your own recipes with them.')}
          </p>
          <button className="btn btn-primary" onClick={() => setSettingsOpen(true)}>
            {t('Create profile')}
          </button>
        </div>
      ) : (
        <Feed
          api={api}
          friends={friends}
          incoming={requests.incoming}
          onAddFriends={() => setFriendsOpen(true)}
        />
      )}

      {friendsOpen && (
        <FriendsSheet
          prefill={prefill}
          onClose={() => {
            setFriendsOpen(false)
            setPrefill('')
          }}
        />
      )}
      {settingsOpen && <SettingsSheet onClose={() => setSettingsOpen(false)} />}
    </div>
  )
}

function Feed({ api, friends, incoming, onAddFriends }) {
  const { t } = useI18n()
  const showToast = useToast()
  const explain = useSocialError()
  const account = useAccount({ load: false })
  const [items, setItems] = useState(feedCache)
  const [loaded, setLoaded] = useState(feedCache.length > 0)
  const [who, setWho] = useState('all')

  // Fetched again whenever the set of friends changes, and on every visit.
  const friendKey = friends.map((f) => f.uid).join()
  useEffect(() => {
    let live = true
    loadFeed(api, friends).then((list) => {
      if (!live) return
      feedCache = list
      setItems(list)
      setLoaded(true)
    })
    return () => {
      live = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, friendKey])

  // A friend removed while their chip was selected leaves nothing to show.
  useEffect(() => {
    if (who !== 'all' && !friends.some((f) => f.uid === who)) setWho('all')
  }, [friends, who])

  const shown = useMemo(() => (who === 'all' ? items : items.filter((c) => c.owner === who)), [items, who])

  const answer = async (r, yes) => {
    try {
      if (yes) {
        await api.accept(r, account.me.uid)
        showToast(t('You and {name} are now friends', { name: r.other.displayName }))
      } else {
        await api.dropRequest(r)
      }
    } catch (err) {
      showToast(explain(err))
    }
  }

  return (
    <>
      {incoming.length > 0 && (
        <div className="social-requests">
          {incoming.map((r) => (
            <div className="request-card" key={r.id}>
              <div className="profile-avatar sm">{r.other.displayName.slice(0, 1).toUpperCase()}</div>
              <div className="request-text">
                <strong>{r.other.displayName}</strong>
                <span>@{r.other.username} · {t('wants to be friends')}</span>
              </div>
              <div className="request-actions">
                <button className="btn" onClick={() => answer(r, false)}>
                  {t('Decline')}
                </button>
                <button className="btn btn-primary" onClick={() => answer(r, true)}>
                  <IconCheck width="16" height="16" /> {t('Accept')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {friends.length === 0 ? (
        <div className="social-gate">
          <div className="icon">👋</div>
          <h3>{t('Add your first friend')}</h3>
          <p>{t('Send a request with a username or friend code. Once they accept, their cocktails show up here.')}</p>
          <button className="btn btn-primary" onClick={onAddFriends}>
            <IconUserPlus /> {t('Add friends')}
          </button>
        </div>
      ) : (
        <>
          <div className="chips friend-chips">
            <button className={'chip' + (who === 'all' ? ' active' : '')} onClick={() => setWho('all')}>
              {t('Everyone')}
            </button>
            {friends.map((f) => (
              <button
                key={f.uid}
                className={'chip' + (who === f.uid ? ' active' : '')}
                onClick={() => setWho(f.uid)}
              >
                {f.displayName}
              </button>
            ))}
          </div>

          {!loaded ? (
            <p className="social-count">{t('Loading…')}</p>
          ) : shown.length === 0 ? (
            <div className="social-gate">
              <div className="icon">🍸</div>
              <h3>{t('Nothing shared yet')}</h3>
              <p>
                {t(
                  who === 'all'
                    ? 'Your friends have not shared any cocktails yet. Anything they create and share appears here.'
                    : 'This friend has not shared any cocktails yet.',
                )}
              </p>
            </div>
          ) : (
            <>
              <p className="social-count">
                {t(shown.length === 1 ? '{n} cocktail' : '{n} cocktails', { n: shown.length })}
              </p>
              <div className="grid">
                {shown.map((c) => (
                  <CocktailCard
                    key={c.owner + c.id}
                    cocktail={c}
                    author={c.ownerName}
                    linkTo={`/social/${c.owner}/${c.id}`}
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </>
  )
}
