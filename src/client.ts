import tmi from 'tmi.js';
import { ClientOptions } from './secret/secrets';
import { getQuiet } from './verbosity';

const client: tmi.Client = new tmi.client(ClientOptions);

//Twitch interface

export function BanBot(
	channel: string,
	botName: string
): void {
	client.say(channel, `/ban ${botName} Suspected bot`);
}

export function Connect() {
	client.connect();
}

export function Part(channel: string) {
	client.part(channel);
}

export function Join(channel: string) {
	client.join(channel);
}

export function Say(
	channel: string,
	message: string,
	checkVerbosityLevel: boolean
): void {
	if(checkVerbosityLevel && getQuiet(channel)) { 
		console.log(	'Response hushed');
		return;
	}

	console.log(`	Sending(${channel}): ${message}`);
	client.say(channel, `/me ${message}`);
}


//Handlers

export function RegisterConnectionHandler(
	handler: (addr: string, port: number) => void
): void {
	client.on('connected', handler);
}

export function RegisterJoinHandler(
	handler: (channel: string, username: string, self: boolean) => void
): void {
	client.on('join', handler);
}

export function RegisterMessageHandler(
	handler: (
		target: string,
		context: tmi.ChatUserstate,
		message: string,
		self: boolean) => void
): void {
	client.on('message', handler);
}
