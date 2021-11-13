require('./server.js')
require('dotenv').config()
const puppeteer = require('puppeteer')
const discord = require('./discord.js')

// Launch browser and keep open
;(async () => {
	const browser = await puppeteer.launch({
		args: [
			'--no-sandbox',
			'--disable-setuid-sandbox',
			'--disable-dev-shm-usage',
			'headless: true',
		],
	})
	const page = await browser.newPage()
	page.setUserAgent(
		'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.192 Safari/537.36'
	)

	let round = 1
	let lastCheck = [{ name: 'test' }]
	monitor(page, round, lastCheck)
})()

// Scrape CoinMarketCap for new coin listings
async function monitor(page, round, lastCheck) {
	await page.goto('https://coinmarketcap.com/new/')
	await page.waitForSelector('table.cmc-table')

	const cryptoList = await page.evaluate(() => {
		const cryptoTable = document.querySelector('table.cmc-table')
		const cryptoRows = cryptoTable.querySelectorAll('tr')
		const cryptoData = []
		for (let i = 1; i < cryptoRows.length; i++) {
			const row = cryptoRows[i]
			const cryptoCells = row.querySelectorAll('td')
			const cryptoName = cryptoCells[2].querySelector('p').innerText
			const cryptoLink = cryptoCells[2].querySelector('a').href
			const cryptoIcon = cryptoCells[2].querySelector('img').src
			const cryptoPrice = cryptoCells[3].innerText
			const cryptoChain = cryptoCells[8].innerText
			cryptoData.push({
				name: cryptoName,
				icon: cryptoIcon,
				link: cryptoLink,
				chain: cryptoChain,
				price: cryptoPrice,
			})
		}
		return cryptoData
	})

	// Check if the newest coin listing is not the same as it was in the previous check
	if (cryptoList[0].name !== lastCheck[0].name && cryptoList[0].chain.includes('Binance') && round > 1) {
		// Get address of new coin
		await page.goto(cryptoList[0].link)
		await page.waitForSelector('.linksSection')
		const cryptoAddress = await page.evaluate(() => {
			const bscscanUrl = document.querySelector(
				'.linksSection .content a.cmc-link'
			).href
			// Split bscscan url after 'token/' to return the contract address
			return bscscanUrl.split('token/')[1]
		})

		// Add address to object with new coin data
		const newCoin = {
			name: cryptoList[0].name,
			icon: cryptoList[0].icon,
			link: cryptoList[0].link,
			price: cryptoList[0].price,
			address: cryptoAddress,
		}

		// Send new coin data to discord
		discord.sendDiscordMsg(newCoin)
		console.log(newCoin.name + ' was just listed!')
	} else {
		// console.log('No new coins found.')
	}

	// Update lastCheck array with new coin data
	lastCheck = cryptoList

	// Wait 1 minute before refreshing page and checking again
	await page.waitForTimeout(60 * 1000)
	monitor(page, round + 1, lastCheck)
		.catch(err => {
			console.log('Error starting monitor', err)
		})
}
