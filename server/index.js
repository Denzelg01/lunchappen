import express from 'express'
import cors from 'cors'
import * as cheerio from 'cheerio'

const app = express()
const port = 3001
const weekdays = ['MÅNDAG', 'TISDAG', 'ONSDAG', 'TORSDAG', 'FREDAG']

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

app.use(cors())

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
        const headings = $('h2')
            .map((index, element) => $(element).text().trim())
            .get()
        const mondayHeading = $('h2')
            .filter((index, element) =>
                $(element).text().trim().toLowerCase().startsWith('måndag'),
            )
            .first()

        const menuElements = $('h2, h3, h4, p').toArray()

        const mondayStartIndex = menuElements.findIndex((element) =>
            $(element).text().trim().toLowerCase().startsWith('måndag'),
        )

        const mondayMenu = []

        if (mondayStartIndex !== -1) {
            for (let index = mondayStartIndex + 1; index < menuElements.length; index++) {
                const element = menuElements[index]

                if ($(element).is('h2')) {
                    break
                }

                const elementCopy = $(element).clone()
                elementCopy.find('br').replaceWith(' – ')

                const text = elementCopy.text().replace(/\s+/g, ' ').trim()

                if (text) {
                    mondayMenu.push(text)
                }
            }
        }
        const mondayParent = {
            tag: mondayHeading.parent().prop('tagName'),
            className: mondayHeading.parent().attr('class') || '',
            text: mondayHeading.parent().text().trim(),
        }
        response.json({
            restaurant: 'Hos Andreas Östersund City',
            pageTitle,
            fetchedSuccessfully: websiteResponse.ok,
            headings,
            mondayMenu,
            mondayParent,
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

        const headings = $('h1, h2, h3, h4, h5, h6')
            .map((index, element) => ({
                tag: element.tagName,
                text: $(element).text().replace(/\s+/g, ' ').trim(),
            }))
            .get()
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

app.listen(port, () => {
    console.log(`Servern körs på http://localhost:${port}`)
}) 