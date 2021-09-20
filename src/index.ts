import fs from 'fs';
import tmi from 'tmi.js';
import { UpdateBotList } from './UpdateBotList';
import { ClientOptions } from './secret/secrets';
import { followerCheck } from './followerCheck';
import { getQuiet, setQuiet, setLoud } from './verbosity';

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
	if(context['display-name']) {
		const followerName: string|null = followerCheck(target, msg, context['display-name'])
		if(followerName) {
			if(isUntrustedBot(followerName)) {
				if(!getQuiet(target)) {
					client.say(target, `/me ${followerName} has registered as an untrusted bot, autobanning`);
				}
				client.say(target, `/ban ${followerName} Suspected bot`);
			} else {
				if(!getQuiet(target)) {
					client.say(target, `/me ${followerName} does not appear to be an untrusted bot. Welcome! (This welcome was sent automatically)`);
				}
			}
		}
	}

	if (self) { return; } // Ignore messages from the bot

	// Remove whitespace from chat message
	const splitMessage: string[] = msg.trim().split(" ");
	if(!splitMessage.length) { return; }
	console.log(splitMessage);
	const commandName: string = splitMessage[0].slice(1);
	const args: string[] = splitMessage.slice(1);

	if(splitMessage[0][0] !== '!') { return; } // Ignore messages that aren't commands

	// If the command is known, let's execute it
	if (commandName.toLocaleLowerCase() === 'join') {
		if(args[0] && context['display-name'] && context['display-name'] == ClientOptions.identity?.username) {
			client.join(args[0]);
		} else {
			console.log(`* Rejected join request to ${args[0]} by ${context['display-name']}`);
		}
	} else if (
		commandName.toLocaleLowerCase() === 'check' ||
		commandName.toLocaleLowerCase() === 'isuntrustedbot' ||
		commandName.toLocaleLowerCase() === 'iub'
	) {
		if(isUntrustedBot(args[0])) {
			client.say(target, `/me ${args[0]} seems to be an untrusted bot`);
		} else {
			client.say(target, `/me ${args[0]} does not seem to be an untrusted bot`);
		}
	} else if (commandName.toLocaleLowerCase() === 'loud') {
		setLoud(target);
	} else if (commandName.toLocaleLowerCase() === 'ping') {
		client.say(target, '/me pong!');
	} else if (commandName.toLocaleLowerCase() === 'quiet') {
		setQuiet(target);
	} else if (commandName.toLocaleLowerCase() === 'stop') {
		client.say(target, '/me Bye!');
		client.part(target);
	} else {
		console.log(`* Unknown command ${commandName}`);
	}
}

// Called every time the bot connects to Twitch chat
function onConnectedHandler (addr: string, port: number) {
	console.log(`* Connected to ${addr}:${port}`);
}

function onJoinHandler(channel: string, username: string, self: boolean) {
	console.log(`${self ? 'I' : username} joined ${channel}`);
	if(isUntrustedBot(username) && !self) {
		console.log(`${username} is an untrusted bot, banning`);
		if(!getQuiet(channel)) {
			client.say(channel, `/me ${username} has registered as an untrusted bot, autobanning`);
		}
		client.say(channel, `/ban ${username} Suspected bot`);
	} else {
		console.log(`${username} is not an untrusted bot`);
	}
}

function isUntrustedBot(username: string): boolean {
	const botList: string[] = JSON.parse(fs.readFileSync('./list.json', 'utf8'));
	return botList.includes(username);
}

setInterval(UpdateBotList, 6*60*1000);
