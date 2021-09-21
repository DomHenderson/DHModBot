import fs from 'fs';
import { UpdateBotList } from './UpdateBotList';

export function isUntrustedBot(username: string): boolean {
	return (
		// TODO: isFollowingTooFast(username) ||
		isViewingManyChannels(username)
	);
}

function isViewingManyChannels(username: string): boolean {
	const botList: string[] = JSON.parse(fs.readFileSync('./list.json', 'utf8'));
	return botList.includes(username);
}

UpdateBotList();
setInterval(UpdateBotList, 5*60*1000);