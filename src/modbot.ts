import fs from 'fs';
import { ClientOptions } from './secret/secrets';
import { IBotAnalyser } from './botAnalysis';
import { IChatInterface } from './chatInterface';

export class ModBot implements ModBot {
	private readonly botFunctions: Map<string,(channel: string, args: string[], sender: string|undefined)=>void>;
	private readonly followerMap: Map<string, {chatbot: string; messageStart: string; messageEnd: string;}>;
	private readonly verbosityPath: string;
	private readonly analyser: IBotAnalyser;
	private readonly chat: IChatInterface;
	private readonly username: string;

	private verbosityLevels: Map<string, string>;

	constructor(
		username: string,
		analyser: IBotAnalyser,
		chat: IChatInterface,
		verbosityPath: string,
		followerMessagesPath: string
	) {
		this.botFunctions = new Map([
			['check', (c: string, a: string[], s: string|undefined) => {return this.botCheck(c,a);}],
			['iub', (c: string, a: string[], s: string|undefined) => {return this.botCheck(c,a);}],
			['isuntrustedbot', (c: string, a: string[], s: string|undefined) => {return this.botCheck(c,a);}],
			['join', (c: string, a: string[], s: string|undefined) => { return this.join(c,a,s);}],
			['loud', (c: string, a: string[], s: string|undefined) => { return this.loud(c);}],
			['ping', (c: string, a: string[], s: string|undefined) => { return this.ping(c);}],
			['quiet', (c: string, a: string[], s: string|undefined) => {return this.quiet(c);}],
			['stop', (c: string, a: string[], s: string|undefined) => {return this.disconnect(c);}]
		]);
		this.followerMap = new Map(JSON.parse(
			fs.readFileSync(followerMessagesPath, 'utf8')
		));
		this.verbosityPath = verbosityPath;
		this.verbosityLevels = new Map();
		this.loadLevels();
		this.analyser = analyser;
		this.chat = chat;

		this.chat.addJoinListener((channel, username, self) => this.processJoin(channel, username, self));
		this.chat.addMessageListener((channel, context, message, self) =>
			this.processMessage(channel, message, context['display-name'], self)
		);
		this.username = username;
	}

	processJoin(channel: string, username: string, self: boolean): void {
		if(self) return;
		if(this.analyser.isUntrustedBot(username)) {
			console.log(`${username} is an untrusted bot, banning`);
			if(!this.getQuiet(channel)) {
				this.chat.say(channel,`${username} has registered as an untrusted bot, autobanning`);
			}
			this.chat.banViewBot(channel, username);
		} else {
			console.log(`${username} is not an untrusted bot`);
		}
	}

	processMessage(channel: string, message: string, sender: string|undefined, self: boolean): void {
		console.log(`${channel} - ${sender}: ${message}`);

		if(this.isFollowAlert(message, channel, sender)) {
			this.processFollowAlert(message, channel, sender);
		}
		
		if (self) { return; }
		
		this.ifCommandThenRespond(message, channel, sender);
	}

	isFollowAlert(message: string, channel: string, sender: string|undefined): boolean {
		const followerMessageInfo = this.followerMap.get(channel);
		if(!followerMessageInfo) return false;
		return (
			sender == followerMessageInfo.chatbot &&
			message.startsWith(followerMessageInfo.messageStart) &&
			message.endsWith(followerMessageInfo.messageEnd)
		);
	}
	processFollowAlert(message: string, channel: string, sender: string|undefined): void {
		const followerName: string|undefined = this.extractFollowerName(message, channel);
		if(!followerName) { return; }
		if(this.analyser.isUntrustedBot(followerName)) {
			if(!this.getQuiet(channel)) {
				this.chat.say(channel,`${followerName} has registered as an untrusted bot, autobanning`);
			}
			this.chat.banViewBot(channel, followerName);
		} else {
			if(!this.getQuiet(channel)) {
				this.chat.say(channel,`${followerName} does not appear to be an untrusted bot. Welcome! (This welcome was sent automatically)`);
			}
		}
	}
	extractFollowerName(message: string, channel: string): string|undefined {
		const followInfo = this.followerMap.get(channel);
		if(followInfo) {
			return message.slice(
				followInfo.messageStart.length,
				-followInfo.messageEnd.length
			);
		} else {
			return undefined;
		}
	}

	ifCommandThenRespond(message: string, channel: string, sender: string|undefined): void {
		const command: Command|null = this.parseMessage(message);

		if(!command) { return; }

		this.executeCommand(command, channel, sender);
	}
	parseMessage(message: string): Command|null {
		const splitMessage: string[] = message.trim().split(" ");

		if(splitMessage.length === 0 || splitMessage[0][0] !== '!') {
			return null;
		} else {
			console.log(`	${splitMessage}`);
		}

		return new Command(
			splitMessage[0].slice(1),
			splitMessage.slice(1)
		);
	}
	executeCommand(command: Command, channel: string, sender: string|undefined): void {
		console.log(`	Executing command ${command.commandName}`);

		const func = this.botFunctions.get(command.commandName.toLocaleLowerCase());
		if(func) {
			func(channel, command.args, sender);
		}
	}


	botCheck(channel: string, args: string[]): void {
		console.log(`	botcheck channel:${channel} args: ${args}`)
		if(args.length == 0) {
			console.log('	WARNING: Attempted to run botcheck without name');
			this.chat.say(channel, 'check requires a name');
			return;
		}
		
		this.chat.say(
			channel,
			this.analyser.isUntrustedBot(args[0])
				? `${args[0]} seems to be an untrusted bot`
				: `${args[0]} does not seem to be an untrusted bot`
		);
	}
	join(channel: string, args: string[], sender: string|undefined): void {
		if(args[0] && sender && sender == this.username) {
			this.chat.join(args[0]);
		} else {
			console.log(`	* Rejected join request to ${args[0]} by ${sender}`);
		}
	}
	loud(channel: string): void {
		this.setLoud(channel);
	}
	ping(channel: string): void {
		this.chat.say(channel, 'pong!');
	}
	quiet(channel: string): void {
		this.setQuiet(channel);
	}
	disconnect(channel: string): void {
		this.chat.say(channel, 'Bye!'),
		this.chat.part(channel);
	}

	getQuiet(channel: string): boolean {
		return this.verbosityLevels.get(channel) === 'quiet';
	}
	setQuiet(channel: string): void {
		console.log(`Setting verbosity level for ${channel} to quiet`);
		this.verbosityLevels.set(channel, 'quiet');
		this.saveLevels();
	}
	setLoud(channel: string): void {
		console.log(`Setting verbosity level for ${channel} to loud`);
		this.verbosityLevels.set(channel, 'loud');
		this.saveLevels();
	}
	loadLevels() {
		this.verbosityLevels.clear();
		const json = JSON.parse(fs.readFileSync('./src/secret/verbosity.json', 'utf-8'));
		for(let value in json) {
			this.verbosityLevels.set(value, json[value]);
		}
	}
	saveLevels() {
		let json: any = {};
		this.verbosityLevels.forEach((value, key) => {
			json[key] = value;
		})
		fs.writeFileSync(this.verbosityPath, JSON.stringify(json, null, 4), 'utf8');
	}
}

class Command {
	constructor(
		public commandName: string,
		public args: string[]
	) {}
}

