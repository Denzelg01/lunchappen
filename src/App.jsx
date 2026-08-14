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

function App() {
  const [lunchData, setLunchData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [showInstallHelp, setShowInstallHelp] = useState(false)

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
              <li>Öppna sidan i Safari.</li>
              <li>
                Tryck på Dela-knappen
                <svg
                  className="share-icon"
                  viewBox="0 0 24 24"
                  aria-label="Dela"
                >
                  <path d="M12 15V3" />
                  <path d="m7.5 7.5 4.5-4.5 4.5 4.5" />
                  <path d="M7 10H5.5A2.5 2.5 0 0 0 3 12.5v6A2.5 2.5 0 0 0 5.5 21h13a2.5 2.5 0 0 0 2.5-2.5v-6a2.5 2.5 0 0 0-2.5-2.5H17" />
                </svg>
              </li>
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