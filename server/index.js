import path from 'path'
import { fileURLToPath } from 'url'
import express from 'express'
import cors from 'cors'
import * as cheerio from 'cheerio'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'



const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({
    path: path.join(__dirname, '..', '.env.local'),
})

const supabaseUrl = process.env.SUPABASE_URL
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY

if (!supabaseUrl || !supabaseSecretKey) {
    throw new Error('Supabase-inställningarna saknas.')
}

const supabase = createClient(supabaseUrl, supabaseSecretKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
    },
})

const notificationSecret = process.env.NOTIFICATION_SECRET

if (!notificationSecret) {
    throw new Error('Utskickshemligheten saknas.')
}

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY
const vapidSubject = process.env.VAPID_SUBJECT

if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
    throw new Error('VAPID-inställningarna saknas.')
}

webpush.setVapidDetails(
    vapidSubject,
    vapidPublicKey,
    vapidPrivateKey,
)


const app = express()
const port = process.env.PORT || 3001
const weekdays = ['MÅNDAG', 'TISDAG', 'ONSDAG', 'TORSDAG', 'FREDAG']
const lunchSchedule = {
    måndag: '/api/hos-andreas?day=MÅNDAG',
    tisdag: '/api/w?day=TISDAG',
    onsdag: '/api/lime',
    torsdag: '/api/campus?day=TORSDAG',
    fredag: '/api/campus?day=FREDAG',
}


const allowedOrigins = process.env.CLIENT_URL
    ? [process.env.CLIENT_URL]
    : ['http://localhost:5173', 'http://localhost:4173']

app.use(
    cors({
        origin: allowedOrigins,
    }),
)

app.use(express.json({ limit: '10kb' }))

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
        const cleanText = text.replace(/[\u200B-\u200D\uFEFF]/g, '').trim()

        if (!cleanText) {
            continue
        }

        if (cleanText.toLowerCase().startsWith('lunchbuffé:')) {
            break
        }

        if (weekdays.includes(cleanText.toUpperCase())) {
            break
        }

        dishes.push(cleanText)
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

app.get('/api/database-health', async (request, response) => {
    const { count, error } = await supabase
        .from('push_subscriptions')
        .select('id', { count: 'exact', head: true })

    if (error) {
        console.error(error)

        return response.status(500).json({
            message: 'Databasen kunde inte nås.',
        })
    }

    response.json({
        message: 'Databasen fungerar!',
        subscriptions: count,
    })
})

app.get('/api/push-public-key', (request, response) => {
    response.json({
        publicKey: vapidPublicKey,
    })
})

app.post('/api/push-subscriptions', async (request, response) => {
    const subscription = request.body
    const endpoint = subscription?.endpoint
    const keys = subscription?.keys

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
        return response.status(400).json({
            message: 'Pushprenumerationen är ogiltig.',
        })
    }

    const { error } = await supabase
        .from('push_subscriptions')
        .upsert(
            {
                endpoint,
                subscription,
                enabled: true,
                updated_at: new Date().toISOString(),
            },
            {
                onConflict: 'endpoint',
            },
        )

    if (error) {
        console.error(error)

        return response.status(500).json({
            message: 'Pushprenumerationen kunde inte sparas.',
        })
    }

    response.status(201).json({
        message: 'Lunchnotiser är aktiverade!',
    })
})

app.post('/api/notifications/test', async (request, response) => {
    const authorization = request.headers.authorization

    if (authorization !== `Bearer ${notificationSecret}`) {
        return response.status(401).json({
            message: 'Du har inte behörighet att skicka notiser.',
        })
    }

    const { data: subscriptions, error } = await supabase
        .from('push_subscriptions')
        .select('id, subscription')
        .eq('enabled', true)

    if (error) {
        console.error(error)

        return response.status(500).json({
            message: 'Prenumerationerna kunde inte hämtas.',
        })
    }

    const payload = JSON.stringify({
        title: 'Lunch JB',
        body: 'Testnotisen fungerar! 🍽️',
        url: '/',
    })

    let sent = 0
    let failed = 0

    for (const savedSubscription of subscriptions) {
        try {
            await webpush.sendNotification(
                savedSubscription.subscription,
                payload,
            )

            sent++
        } catch (pushError) {
            console.error(pushError)
            failed++

            if (
                pushError.statusCode === 404 ||
                pushError.statusCode === 410
            ) {
                await supabase
                    .from('push_subscriptions')
                    .update({
                        enabled: false,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', savedSubscription.id)
            }
        }
    }

    response.json({
        message: 'Testutskicket är klart.',
        sent,
        failed,
    })
})

const distPath = path.join(__dirname, '..', 'dist')

app.use(express.static(distPath))

app.get('/{*splat}', (request, response) => {
    response.sendFile(path.join(distPath, 'index.html'))
})



app.listen(port, () => {
    console.log(`Servern körs på http://localhost:${port}`)
})