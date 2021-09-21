import fs from 'fs';

export function isUntrustedBot(username: string, botListPath: string): boolean {
	return (
		// TODO: isFollowingTooFast(username) ||
		isViewingManyChannels(username, botListPath)
	);
}

function isViewingManyChannels(username: string, botListPath: string): boolean {
	const botList: string[] = JSON.parse(fs.readFileSync(botListPath ? botListPath : './list.json', 'utf8'));
	return botList.includes(username);
}
