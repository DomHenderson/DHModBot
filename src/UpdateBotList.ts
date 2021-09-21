import axios from 'axios';
import fs from 'fs';

export async function UpdateBotList() {
	const channelMinimum = 20;
	const daysMinimum = 30;
	const lastOnline = Math.floor(Date.now() / 1000) - daysMinimum * 24 * 60 * 60;
	const whitelist = JSON.parse(fs.readFileSync('./whitelist.json', 'utf8'));
	const bots = await fetchList();
	filterList(channelMinimum, daysMinimum, lastOnline, whitelist, bots);
}

async function fetchList() {
	console.log('-Fetching botlist, this will take a moment..');
	const res: any = await axios.get('https://api.twitchinsights.net/v1/bots/all');
	const json = res.data;
	console.log('-Received list of ' + json.bots.length + ' names.');
	return json.bots;
}

function filterList(channelMinimum: number, daysMinimum: number, lastOnline: number, whitelist: string[], bots: any) {
	console.log('-Filtering list..');
	console.log('-Minimum Channels the bot needs to be in: ' + channelMinimum);
	console.log('-Last Online within: ' + daysMinimum + ' days');
	let filteredBots = [];

	for (let i = 0; i < bots.length; i++) {
		let bot = bots[i];
		let name = bot[0];

		// check channel count
		if (bot[1] < channelMinimum) {
		continue;
		}

		// check last activity
		if (bot[2] < lastOnline) {
		continue;
		}

		// check whitelist
		if (whitelist.includes(name)) {
			continue;
		}

		filteredBots.push(name);
	}

	filteredBots.sort();
	fs.writeFileSync('list.json', JSON.stringify(filteredBots, null, 2), 'utf8');
	console.log('-The list.json now contains ' + filteredBots.length + ' usernames.');
}
