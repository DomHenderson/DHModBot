import tmi, { client } from 'tmi.js';
import { isUntrustedBot } from './botAnalysis';
import { ifCommandThenRespond } from "./botCommands";
import { BanBot, Connect, RegisterConnectionHandler, RegisterJoinHandler, RegisterMessageHandler, Say } from './client';
import { ifFollowAlertThenCheckFollower } from "./followerCheck";

// Called every time the bot connects to Twitch chat
RegisterConnectionHandler((addr: string, port: number): void => {
	console.log(`* Connected to ${addr}:${port}`);
});

RegisterJoinHandler((channel: string, username: string, self: boolean): void => {
	console.log('');
	console.log(`${self ? 'I' : username} joined ${channel}`);
	if(isUntrustedBot(username) && !self) {
		console.log(`${username} is an untrusted bot, banning`);
		Say(
			channel,
			`${username} has registered as an untrusted bot, autobanning`,
			true
		)
		BanBot(channel, username);
	} else {
		console.log(`${username} is not an untrusted bot`);
	}
	console.log('');
});

RegisterMessageHandler((
	target: string,
	context: tmi.ChatUserstate,
	msg: string,
	self: boolean
): void => {
	console.log(`${target} - ${context['display-name']}: ${msg}`);

	ifFollowAlertThenCheckFollower(msg, target, context);
	
	if (self) { return; }
	
	ifCommandThenRespond(msg, target, context);
});

Connect();