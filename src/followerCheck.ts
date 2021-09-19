import fs from 'fs';

const followerMap = JSON.parse(fs.readFileSync('./src/secret/followerMessages.json', 'utf8'));

export function followerCheck(channel: string, message: string, sender: string): string|null {
	console.log(channel);
	console.log(message);
	console.log(sender);
	console.log(followerMap[channel]);

	if(
		followerMap[channel] &&
		sender === followerMap[channel].chatbot &&
		message.startsWith(followerMap[channel].messageStart) &&
		message.endsWith(followerMap[channel].messageEnd)
	) {
		return message.slice(followerMap[channel].messageStart.length, -followerMap[channel].messageEnd.length);
	} else {
		return null;
	}
}