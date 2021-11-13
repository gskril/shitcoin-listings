const { Webhook, MessageBuilder } = require('discord-webhook-node')
const hook = new Webhook(process.env.DISCORD_WEBHOOK)

sendDiscordMsg = (coin) => {
	const embed = new MessageBuilder()
		.setColor('#3861fb')
		.setTitle('New Shitcoin Listing')
		.setDescription(`Chart it on [PooCoin](https://poocoin.app/tokens/${coin.address})\nTrade it on [PancakeSwap](https://pancakeswap.finance/swap)`)
		.setThumbnail(coin.icon)
		.addField('**Name**', coin.name, true)
		.addField('**Symbol**', coin.symbol, true)
		.addField('**Price**', coin.price, true)
		.addField('**Address**', coin.address, false)

	hook.send(embed)
}

module.exports = {  sendDiscordMsg }
