import express from 'express'
import cors from 'cors'
import * as cheerio from 'cheerio'

const app = express()
const port = 3001
const weekdays = ['MÅNDAG', 'TISDAG', 'ONSDAG', 'TORSDAG', 'FREDAG']
const lunchSchedule = {
    måndag: '/api/hos-andreas?day=MÅNDAG',
    tisdag: '/api/w?day=TISDAG',
    onsdag: '/api/lime',
    torsdag: '/api/campus?day=TORSDAG',
    fredag: '/api/campus?day=FREDAG',
}


app.use(cors())

function extractMenuForDay(textBlocks, selectedDay) {
    const startIndex = textBlocks.findIndex(
        (text) => text.toUpperCase() === selectedDay,
    )

    if (startIndex === -1) {
        return []
    }

    const dishes = []

    for (let index = startIndex + 1; index < textBlocks.length; index++) {
        const text = textBlocks[index]

        if (weekdays.includes(text.toUpperCase())) {
            break
        }

        dishes.push(text)
    }

    return dishes
}

function extractMenuBetween(textBlocks, startMarker, endMarker) {
    const startIndex = textBlocks.findIndex(
        (text) => text.toLowerCase() === startMarker.toLowerCase(),
    )

    if (startIndex === -1) {
        return []
    }

    const menu = []

    for (let index = startIndex + 1; index < textBlocks.length; index++) {
        const text = textBlocks[index]

        if (text.toLowerCase() === endMarker.toLowerCase()) {
            break
        }

        menu.push(text)
    }

    return menu
}

app.get('/api/health', (request, response) => {
    response.json({
        message: 'Lunchservern fungerar!',
    })
})

app.get('/api/hos-andreas', async (request, response) => {
    try {
        const websiteResponse = await fetch(
            'https://www.hosandreas.se/lunchmeny-city/',
        )

        const html = await websiteResponse.text()
        const $ = cheerio.load(html)
        const pageTitle = $('title').text().trim()
        const requestedDay = (request.query.day || 'MÅNDAG').toUpperCase()

        if (!weekdays.includes(requestedDay)) {
            return response.status(400).json({
                message: 'Ogiltig veckodag. Välj måndag till fredag.',
            })
        }

        const menuElements = $('h2, h3, h4, p').toArray()

        const startIndex = menuElements.findIndex((element) =>
            $(element)
                .text()
                .trim()
                .toLowerCase()
                .startsWith(requestedDay.toLowerCase()),
        )

        const menu = []

        if (startIndex !== -1) {
            for (
                let index = startIndex + 1;
                index < menuElements.length;
                index++
            ) {
                const element = menuElements[index]

                if ($(element).is('h2')) {
                    break
                }

                const elementCopy = $(element).clone()
                elementCopy.find('br').replaceWith(' – ')

                const text = elementCopy.text().replace(/\s+/g, ' ').trim()

                if (text) {
                    menu.push(text)
                }
            }
        }

        response.json({
            restaurant: 'Hos Andreas Östersund City',
            day: requestedDay,
            pageTitle,
            fetchedSuccessfully: websiteResponse.ok,
            menu,
        })
    } catch (error) {
        console.error(error)

        response.status(500).json({
            message: 'Kunde inte hämta menyn från Hos Andreas.',
        })
    }
})

app.get('/api/campus', async (request, response) => {
    try {
        const websiteResponse = await fetch(
            'https://www.campusrestaurangen.com/dagens-lunch',
        )

        const html = await websiteResponse.text()
        const $ = cheerio.load(html)

        const textBlocks = $('p')
            .map((index, element) =>
                $(element).text().replace(/\s+/g, ' ').trim(),
            )
            .get()
            .filter(Boolean)

        const requestedDay = (request.query.day || 'TORSDAG').toUpperCase()

        if (!weekdays.includes(requestedDay)) {
            return response.status(400).json({
                message: 'Ogiltig veckodag. Välj måndag till fredag.',
            })
        }

        const menu = extractMenuForDay(textBlocks, requestedDay)

        response.json({
            restaurant: 'Campusrestaurangen',
            day: requestedDay,
            fetchedSuccessfully: websiteResponse.ok,
            menu,
        })
    } catch (error) {
        console.error(error)

        response.status(500).json({
            message: 'Kunde inte hämta menyn från Campusrestaurangen.',
        })
    }
})

app.get('/api/lime', async (request, response) => {
    try {
        const websiteResponse = await fetch(
            'https://limeostersund.se/odenskog/',
        )

        const html = await websiteResponse.text()
        const $ = cheerio.load(html)

        const textBlocks = $('h1, h2, h3, h4, h5, h6, p')
            .map((index, element) =>
                $(element).text().replace(/\s+/g, ' ').trim(),
            )
            .get()
            .filter(Boolean)
        const menu = extractMenuBetween(textBlocks, 'Lill-Lördag', 'Torsdag')

        response.json({
            restaurant: 'LIME Odenskog',
            day: 'ONSDAG',
            fetchedSuccessfully: websiteResponse.ok,
            menu,
        })
    } catch (error) {
        console.error(error)

        response.status(500).json({
            message: 'Kunde inte hämta menyn från LIME Odenskog.',
        })
    }
})

app.get('/api/w', async (request, response) => {
    try {
        const websiteResponse = await fetch(
            'https://www.w-welcome.se/dagens-lunch',
        )

        const html = await websiteResponse.text()
        const $ = cheerio.load(html)

        const textBlocks = $('h1, h2, h3, h4, h5, h6, p')
            .map((index, element) =>
                $(element).text().replace(/\s+/g, ' ').trim(),
            )
            .get()
            .filter(Boolean)
        const requestedDay = (request.query.day || 'TISDAG').toUpperCase()

        if (!weekdays.includes(requestedDay)) {
            return response.status(400).json({
                message: 'Ogiltig veckodag. Välj måndag till fredag.',
            })
        }

        const menu = extractMenuForDay(textBlocks, requestedDay)

        if (menu.length === 0) {
            return response.status(422).json({
                restaurant: 'W Welcome',
                day: requestedDay,
                message: 'Menyn kunde hämtas, men dagens rätter kunde inte identifieras.',
                menuUrl: 'https://www.w-welcome.se/dagens-lunch',
            })
        }

        response.json({
            restaurant: 'W Welcome',
            day: requestedDay,
            fetchedSuccessfully: websiteResponse.ok,
            menu,
        })
    } catch (error) {
        console.error(error)

        response.status(500).json({
            message: 'Kunde inte hämta menyn från W Welcome.',
        })
    }
})

app.get('/api/today', (request, response) => {
    const today = new Intl.DateTimeFormat('sv-SE', {
        weekday: 'long',
        timeZone: 'Europe/Stockholm',
    })
        .format(new Date())
        .toLowerCase()

    const menuEndpoint = lunchSchedule[today]

    if (!menuEndpoint) {
        return response.status(404).json({
            day: today,
            message: 'Ingen lunch är planerad idag.',
        })
    }

    response.redirect(307, menuEndpoint)
})

app.listen(port, () => {
    console.log(`Servern körs på http://localhost:${port}`)
})