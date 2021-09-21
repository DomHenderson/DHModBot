import fs from 'fs';
import tmi from 'tmi.js';
import { isUntrustedBot } from './botAnalysis';
import { BanBot, Say } from './client';

export function ifFollowAlertThenCheckFollower(
	message: string,
	channel: string,
	context: tmi.ChatUserstate
) {
	if(!context['display-name']) { return; }

	const followerName: string|null = followerCheck(
		channel,
		message,
		context['display-name']
	);

	if(!followerName) { return; }
	
	if(isUntrustedBot(followerName)) {
		Say(
			channel,
			`${followerName} has registered as an untrusted bot, autobanning`,
			true
		);
		BanBot(channel, followerName);
	} else {
		Say(
			channel,
			`${followerName} does not appear to be an untrusted bot. Welcome! (This welcome was sent automatically)`,
			true
		);
	}
}

const followerMap = JSON.parse(
	fs.readFileSync('./src/secret/followerMessages.json', 'utf8')
);

export function followerCheck(
	channel: string,
	message: string,
	sender: string
): string|null {
	if(isFollowMessage(message, sender, channel)) {
		console.log(`	"${message}" identified as follower alert`);
		return extractFollowerName(message, channel);
	} else {
		return null;
	}
}

function isFollowMessage(
	message: string,
	sender: string,
	channel: string
): boolean {
	const followerMessageInfo = followerMap[channel];
	return (
		followerMessageInfo &&
		sender == followerMessageInfo.chatbot &&
		message.startsWith(followerMessageInfo.messageStart) &&
		message.endsWith(followerMessageInfo.messageEnd)
	);
}

function extractFollowerName(
	message: string,
	channel: string
): string {
	return message.slice(
		followerMap[channel].messageStart.length,
		-followerMap[channel].messageEnd.length
	);
}

