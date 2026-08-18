import { useEffect, useState } from 'react'
import './App.css'

const apiUrl = import.meta.env.DEV ? 'http://localhost:3001' : ''

const schedule = [
  {
    day: 'Måndag',
    restaurant: 'Hos Andreas Östersund City',
    menuUrl: 'https://www.hosandreas.se/lunchmeny-city/',
  },
  {
    day: 'Tisdag',
    restaurant: 'W Welcome',
    menuUrl: 'https://www.w-welcome.se/dagens-lunch',
  },
  {
    day: 'Onsdag',
    restaurant: 'LIME Odenskog',
    menuUrl: 'https://limeostersund.se/odenskog/',
  },
  {
    day: 'Torsdag',
    restaurant: 'Campusrestaurangen',
    menuUrl: 'https://www.campusrestaurangen.com/dagens-lunch',
  },
  {
    day: 'Fredag',
    restaurant: 'Campusrestaurangen',
    menuUrl: 'https://www.campusrestaurangen.com/dagens-lunch',
  },
]

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)

  return Uint8Array.from(rawData, (character) =>
    character.charCodeAt(0),
  )
}

function App() {
  const [lunchData, setLunchData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [showInstallHelp, setShowInstallHelp] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState('')
  const [isSubscribing, setIsSubscribing] = useState(false)

  const isInstalled =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true


  const todayIndex = new Date().getDay() - 1
  const todaysLunch =
    todayIndex >= 0 && todayIndex < schedule.length
      ? schedule[todayIndex]
      : null

  useEffect(() => {
    async function fetchTodaysLunch() {
      try {
        const response = await fetch(`${apiUrl}/api/today`)
        const data = await response.json()


        if (!response.ok) {
          throw new Error(data.message || 'Dagens meny kunde inte hämtas.')
        }

        setLunchData(data)
      } catch (error) {
        setErrorMessage(error.message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTodaysLunch()
  }, [])

  async function enableNotifications() {
    if (
      !('serviceWorker' in navigator) ||
      !('PushManager' in window) ||
      !('Notification' in window)
    ) {
      setNotificationMessage(
        'Den här webbläsaren stöder inte pushnotiser.',
      )
      return
    }

    if (!isInstalled) {
      setNotificationMessage(
        'Lägg först till appen på hemskärmen och öppna den därifrån.',
      )
      return
    }

    try {
      setIsSubscribing(true)
      setNotificationMessage('')

      const permission = await window.Notification.requestPermission()

      if (permission !== 'granted') {
        throw new Error('Du behöver tillåta notiser i telefonens inställningar.')
      }

      const registration = await navigator.serviceWorker.ready

      const keyResponse = await fetch(`${apiUrl}/api/push-public-key`)
      const keyData = await keyResponse.json()

      if (!keyResponse.ok || !keyData.publicKey) {
        throw new Error('Pushnyckeln kunde inte hämtas.')
      }

      let subscription =
        await registration.pushManager.getSubscription()

      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(
            keyData.publicKey,
          ),
        })
      }

      const saveResponse = await fetch(
        `${apiUrl}/api/push-subscriptions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(subscription),
        },
      )

      const saveData = await saveResponse.json()

      if (!saveResponse.ok) {
        throw new Error(
          saveData.message || 'Prenumerationen kunde inte sparas.',
        )
      }

      setNotificationMessage('Lunchnotiser är aktiverade!')
    } catch (error) {
      setNotificationMessage(error.message)
    } finally {
      setIsSubscribing(false)
    }
  }

  return (
    <main className="app">
      <header className="hero">
        <p className="eyebrow">Lunch Jämtland Basket</p>
        <h1>Vad blir det till lunch?</h1>
        <p className="intro">
          Rätt restaurang för varje vardag – samlad på ett ställe.
        </p>

        {!isInstalled && (
          <button
            className="install-button"
            type="button"
            onClick={() => setShowInstallHelp(true)}
          >
            <img
              className="install-logo"
              src="/pwa-192x192.png"
              alt=""
              aria-hidden="true"
            />
            Gör till app på hemskärmen
          </button>
        )}

        {isInstalled && (
          <>
            <button
              className="notification-button"
              type="button"
              disabled={isSubscribing}
              onClick={enableNotifications}
            >
              {isSubscribing
                ? 'Aktiverar...'
                : '🔔 Aktivera lunchnotiser'}
            </button>

            {notificationMessage && (
              <p className="notification-message">
                {notificationMessage}
              </p>
            )}
          </>
        )}
      </header>

      <section className="today-card">
        <span className="label">Dagens restaurang</span>

        {todaysLunch ? (
          <>
            <h2>{lunchData?.restaurant || todaysLunch.restaurant}</h2>
            <p>{todaysLunch.day}</p>

            {isLoading && <p>Hämtar dagens meny...</p>}

            {errorMessage && (
              <p>Menyn kunde inte hämtas: {errorMessage}</p>
            )}

            {lunchData?.menu && (
              <ul className="dish-list">
                {lunchData.menu.map((dish) => (
                  <li key={dish}>{dish}</li>
                ))}
              </ul>
            )}

            <a
              className="menu-button"
              href={todaysLunch.menuUrl}
              target="_blank"
              rel="noreferrer"
            >
              Öppna restaurangens meny
            </a>
          </>
        ) : (
          <>
            <h2>Ingen planerad lunch idag</h2>
            <p>Veckoschemat gäller måndag till fredag.</p>
          </>
        )}
      </section>

      <section className="week">
        <h2>Veckans lunchschema</h2>

        <div className="schedule">
          {schedule.map((lunch) => (
            <article
              className={
                todaysLunch?.day === lunch.day
                  ? 'schedule-card active'
                  : 'schedule-card'
              }
              key={lunch.day}
            >
              <span>{lunch.day}</span>
              <h3>{lunch.restaurant}</h3>
              <a href={lunch.menuUrl} target="_blank" rel="noreferrer">
                Öppna menyn
              </a>
            </article>
          ))}
        </div>
      </section>

      {showInstallHelp && (
        <div
          className="install-overlay"
          role="presentation"
          onClick={() => setShowInstallHelp(false)}
        >
          <section
            className="install-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="install-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="close-button"
              type="button"
              aria-label="Stäng"
              onClick={() => setShowInstallHelp(false)}
            >
              ×
            </button>

            <h2 id="install-title">Lägg till Lunch JB</h2>

            <ol>
              <li>
                Om du inte ser Dela-knappen: tryck först på menyn med tre
                punkter
                <svg
                  className="menu-icon"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle cx="5" cy="12" r="1.8" />
                  <circle cx="12" cy="12" r="1.8" />
                  <circle cx="19" cy="12" r="1.8" />
                </svg>
                i hörnet.
              </li>

              <li>
                Tryck på Dela-knappen
                <svg
                  className="share-icon"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M12 15V3" />
                  <path d="m7.5 7.5 4.5-4.5 4.5 4.5" />
                  <path d="M7 10H5.5A2.5 2.5 0 0 0 3 12.5v6A2.5 2.5 0 0 0 5.5 21h13a2.5 2.5 0 0 0 2.5-2.5v-6a2.5 2.5 0 0 0-2.5-2.5H17" />
                </svg>
              </li>

              <li>Tryck på Visa mer om alternativet inte syns.</li>
              <li>Välj Lägg till på hemskärmen.</li>
              <li>Tryck på Lägg till.</li>
            </ol>
          </section>
        </div>
      )}
    </main>
  )
}

export default App