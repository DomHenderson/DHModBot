import fs from 'fs';
import tmi from 'tmi.js';
import { UpdateBotList } from './UpdateBotList';
import { ClientOptions } from './secret/secrets';

const client: tmi.Client = new tmi.client(ClientOptions);

// Register our event handlers (defined below)
client.on('message', onMessageHandler);
client.on('connected', onConnectedHandler);
client.on('join', onJoinHandler);

// Connect to Twitch:
client.connect();

UpdateBotList();

// Called every time a message comes in
function onMessageHandler (target: string, context: tmi.ChatUserstate, msg: string, self: boolean) {
	if (self) { return; } // Ignore messages from the bot

	// Remove whitespace from chat message
	const splitMessage: string[] = msg.trim().split(" ");
	if(!splitMessage.length) { return; }
	console.log(splitMessage);
	const commandName: string = splitMessage[0].slice(1);
	const args: string[] = splitMessage.slice(1);

	if(splitMessage[0][0] !== '!') { return; } // Ignore messages that aren't commands

	// If the command is known, let's execute it
	if (
		commandName.toLocaleLowerCase() === 'istrustedbot' ||
		commandName.toLocaleLowerCase() === 'itb'
	) {
		if(isUntrustedBot(args[0])) {
			client.say(target, `/me ${args[0]} is an untrusted bot`);
		} else {
			client.say(target, `/me ${args[0]} is not an untrusted bot`);
		}
	} else {
		console.log(`* Unknown command ${commandName}`);
	}
}

// Called every time the bot connects to Twitch chat
function onConnectedHandler (addr: string, port: number) {
	console.log(`* Connected to ${addr}:${port}`);
}

function isUntrustedBot(username: string): boolean {
	const botList: string[] = JSON.parse(fs.readFileSync('./list.json', 'utf8'));
	return botList.includes(username);
}

function onJoinHandler(channel: string, username: string, self: boolean) {
	console.log(channel);
	console.log(username);
	console.log(self);
	if(isUntrustedBot(username) && !self) {
		console.log(`${username} is an untrusted bot, banning`);
		client.say(channel, `/me ${username} has registered as an untrusted bot, autobanning`);
		client.say(channel, `/ban ${username}`);
	} else {
		console.log(`${username} is not an untrusted bot`);
	}
}

setInterval(UpdateBotList, 6*60*1000);
