import express from 'express'
import cors from 'cors'
import * as cheerio from 'cheerio'

const app = express()
const port = 3001

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

app.listen(port, () => {
    console.log(`Servern körs på http://localhost:${port}`)
}) 