import tmi from 'tmi.js';

export interface IChatInterface {
	addJoinListener(func: (channel: string, username: string, self: boolean) => void): void;
	addMessageListener(func: (channel: string, context: tmi.ChatUserstate, message: string, self: boolean) => void ): void;
	getConnectedChannels(): string[];
	banFollowBot(channel: string, username: string): void;
	banViewBot(channel: string, username: string): void;
	join(channel: string): void;
	part(channel: string): void;
	say(channel: string, message: string): void;
}

export class TwitchInterface implements IChatInterface{
	private client: tmi.Client;
	private connectedChannels: string[] = [];
	private joinListeners: ((channel: string, username: string, self: boolean) => void)[];
	private messageListeners: ((channel: string, context: tmi.ChatUserstate, message: string, self: boolean) => void)[]

	constructor(
		clientOptions: tmi.Options
	) {
		this.client = new tmi.client(clientOptions)
		this.joinListeners = [];
		this.messageListeners = [];


		this.client.on(
			'connected',
			(addr, port) => this.connectionHandler(addr, port)
		);
		this.client.on(
			'join',
			(channel, username, self) => this.joinHandler(channel, username, self)
		);
		this.client.on(
			'message',
			(channel, context, message, self) => this.messageHandler(channel, context, message, self)
		);
		this.client.connect();
	}

	addJoinListener(func: (channel: string, username: string, self: boolean) => void): void {
		this.joinListeners.push(func);
	}

	addMessageListener(func: (channel: string, context: tmi.ChatUserstate, message: string, self: boolean) => void ): void {
		this.messageListeners.push(func);
	}
	
	getConnectedChannels(): string[] {
		return this.connectedChannels;
	}
	
	banFollowBot(
		channel: string,
		botName: string
	): void {
		console.log(`	Banning(${channel}) ${botName} for following too fast`)
		this.client.say(channel, `/ban ${botName} Suspected bot (following too fast)`)
	}

	banViewBot(
		channel: string,
		botName: string
	): void {
		console.log(`	Banning(${channel}) ${botName} for viewing too many channels simultaneously`);
		this.client.say(channel, `/ban ${botName} Suspected bot (too many channels)`);
	}
	
	join(channel: string): void {
		this.client.join(channel);
	}
	
	part(channel: string): void {
		//TODO check for initial #
		this.client.part(channel);
		console.log(`Leaving ${channel}`);
		if(this.connectedChannels.includes(channel)) {
			this.connectedChannels = this.connectedChannels.filter((x) => x !== channel);
		}
		console.log(`now in channels ${this.connectedChannels.toString()}`);
	}
	
	say(
		channel: string,
		message: string
	): void {
		console.log(`	Sending(${channel}): ${message}`);
		this.client.say(channel, `/me ${message}`);
	}

	private connectionHandler(addr: string, port: number): void {
		console.log(`* Connected to ${addr}:${port}`);
	}
		
	private joinHandler(channel: string, username: string, self: boolean): void {
		console.log('');
		console.log(`${self ? 'I' : username} joined ${channel}`);
		if(self) {
			if(!this.connectedChannels.includes(channel)) {
				this.connectedChannels.push(channel);
				console.log(this.connectedChannels);
			}
		}
		this.joinListeners.forEach((listener) => listener(channel, username, self));
		console.log('');
	}
		
	private messageHandler(
		channel: string,
		context: tmi.ChatUserstate,
		message: string,
		self: boolean
	): void {
		this.messageListeners.forEach((listener) => listener(channel, context, message, self));
	}
}
