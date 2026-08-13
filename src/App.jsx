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
    </main>
  )
}

export default App