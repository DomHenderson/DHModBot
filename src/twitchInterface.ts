import tmi from 'tmi.js';
import { isUntrustedBot } from './botAnalysis';
import { BanBot, ChatAction, Join, Part, Say } from './chatActions';
import { IModBot } from './modbot';
import { ClientOptions } from './secret/secrets';

export class TwitchInterface {
	private modBot: IModBot;
	private client: tmi.Client;
	constructor(
		behaviour: IModBot
	) {
		this.modBot = behaviour;
		console.log(this.modBot.processMessage('#domhenderson1', '!ping', 'domhenderson1', false));
		this.client = new tmi.client(ClientOptions)
		this.client.on(
			'connected',
			(addr, port) => { this.connectionHandler(addr, port); }
		);
		this.client.on(
			'join',
			(channel, username, self) => {
				this.joinHandler(channel, username, self);
			}
		);
		this.client.on(
			'message',
			(channel, context, message, self) => {
				this.messageHandler(channel, context, message, self);
			}
		);
		this.client.connect();
	}

	connectionHandler(addr: string, port: number): void {
		console.log(`* Connected to ${addr}:${port}`);
	}

	joinHandler(channel: string, username: string, self: boolean): void {
		console.log('');
		console.log(`${self ? 'I' : username} joined ${channel}`);
		if(!self) {
			this.processChatActions(this.modBot.processJoin(
				channel,
				username
			));
		}
		console.log('');
	}

	messageHandler(
		channel: string,
		context: tmi.ChatUserstate,
		message: string,
		self: boolean
	): void {
		this.processChatActions(this.modBot.processMessage(
			channel,
			message,
			context['display-name'],
			self
		));
	}
	
	processChatActions(chatActions: ChatAction[]): void {
		for(let i = 0; i < chatActions.length; ++i) {
			const action = chatActions[i];
			if(action instanceof BanBot) {
				this.banBot(action.channel, action.username);
			} else if (action instanceof Join) {
				this.client.join(action.channel);
			} else if (action instanceof Part) {
				this.client.part(action.channel);
			} else if (action instanceof Say) {
				this.say(action.channel, action.message, true);
			}
		}
	}


	banBot(
		channel: string,
		botName: string
	): void {
		console.log(`	Banning(${channel}) ${botName}`);
		this.client.say(channel, `/ban ${botName} Suspected bot`);
	}

	say(
		channel: string,
		message: string,
		checkVerbosityLevel: boolean
	): void {
		// if(checkVerbosityLevel && getQuiet(channel)) { 
		// 	console.log(	'Response hushed');
		// 	return;
		// }
	
		console.log(`	Sending(${channel}): ${message}`);
		this.client.say(channel, `/me ${message}`);
	}
}
