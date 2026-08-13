import './App.css'

const schedule = [
  {
    day: 'Måndag',
    restaurant: 'Hos Andreas Östersund City',
    menuUrl: 'https://www.hosandreas.se/lunchmeny-city/',
    dishes: [
      'Exempelrätt 1',
      'Exempelrätt 2',
      'Vegetariskt alternativ',
    ],
  },
  {
    day: 'Tisdag',
    restaurant: 'W Welcome',
    menuUrl: 'https://www.w-welcome.se/dagens-lunch',
    dishes: [
      'Exempelrätt 1',
      'Exempelrätt 2',
      'Vegetariskt alternativ',
    ],
  },
  {
    day: 'Onsdag',
    restaurant: 'LIME Odenskog',
    menuUrl: 'https://limeostersund.se/odenskog/',
    dishes: [
      'Exempelrätt 1',
      'Exempelrätt 2',
      'Vegetariskt alternativ',
    ],
  },
  {
    day: 'Torsdag',
    restaurant: 'Campusrestaurangen',
    menuUrl: 'https://www.campusrestaurangen.com/dagens-lunch',
    dishes: [
      'Exempelrätt 1',
      'Exempelrätt 2',
      'Vegetariskt alternativ',
    ],
  },
  {
    day: 'Fredag',
    restaurant: 'Campusrestaurangen',
    menuUrl: 'https://www.campusrestaurangen.com/dagens-lunch',
    dishes: [
      'Exempelrätt 1',
      'Exempelrätt 2',
      'Vegetariskt alternativ',
    ],
  },
]

function App() {
  const todayIndex = new Date().getDay() - 1
  const todaysLunch =
    todayIndex >= 0 && todayIndex < schedule.length
      ? schedule[todayIndex]
      : null

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
            <h2>{todaysLunch.restaurant}</h2>
            <p>{todaysLunch.day}</p>
            <ul className="dish-list">
   {todaysLunch.dishes.map((dish) => (
    <li key={dish}>{dish}</li>
  ))}
</ul>
            <a
              className="menu-button"
              href={todaysLunch.menuUrl}
              target="_blank"
              rel="noreferrer"
            >
              Visa dagens meny
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