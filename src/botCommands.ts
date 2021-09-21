import tmi from 'tmi.js';
import { isUntrustedBot } from "./botAnalysis";
import { Join, Part, Say } from "./client";
import { ClientOptions } from './secret/secrets';
import { setLoud, setQuiet } from './verbosity';

const botFunctions: Map<string[],(channel: string, args: string[], sender: string|undefined)=>void> = new Map([
	[['check', 'isuntrustedbot', 'iub'], botCheck],
	[['join'], join],
	[['loud'], loud],
	[['ping'], ping],
	[['quiet'], quiet],
	[['stop'], disconnect]
]);

export function ifCommandThenRespond(
	message: string,
	channel: string,
	context: tmi.ChatUserstate
) {
	const command: Command|null = parseMessage(message);

	if(!command) { return; }

	executeCommand(command, channel, context['display-name']);
}

function parseMessage(message: string) : Command|null{
	// Remove whitespace and tokenise
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

function executeCommand(command: Command, channel: string, sender: string|undefined): void {
	console.log(`	Executing command ${command.commandName}`);
	botFunctions.forEach((func, names) => {
		if(names.includes(command.commandName.toLocaleLowerCase())) {
			func(channel, command.args, sender);
		}
	})
}

class Command {
	constructor(
		public commandName: string,
		public args: string[]
	) {}
}



//Bot command implementations

function botCheck(channel: string, args: string[]) {
	console.log(`	botcheck channel:${channel} args: ${args}`)
	if(args.length == 0) {
		console.log('	WARNING: Attempted to run botcheck without name');
		return;
	}
	if(isUntrustedBot(args[0])) {
		Say(
			channel,
			`${args[0]} seems to be an untrusted bot`,
			false
		)
	} else {
		Say(
			channel,
			`${args[0]} does not seem to be an untrusted bot`,
			false
		)
	}
}

function join(channel: string, args: string[], sender: string|undefined) {
	if(args[0] && sender && sender == ClientOptions.identity?.username) {
		Join(args[0]);
	} else {
		console.log(`	* Rejected join request to ${args[0]} by ${sender}`);
	}
}

function loud(channel: string) {
	setLoud(channel);
}

function ping(channel: string) {
	Say(channel, 'pong!', false);
}

function quiet(channel: string) {
	setQuiet(channel);
}

function disconnect(channel: string) {
	Say(channel, 'Bye!', false);
	Part(channel);
}