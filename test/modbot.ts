import fs from 'fs';
import { expect } from 'chai';
import { ModBot } from '../src/modbot';
import { IBotAnalyser } from '../src/botAnalysis';
import { IChatInterface } from '../src/chatInterface';
import { ChatUserstate } from 'tmi.js';

const TestChannel: string = 'TEST_CHANNEL';
const TestContext: ChatUserstate = {
	'display-name': 'TEST_SENDER'
};
const TestModBotUsername: string = 'TEST_MODBOT';
const TestGoodChatBot: string = 'TEST_CHATBOT';

afterEach(() => {
	fs.writeFileSync('./test/testVerbosity.json', '{}', 'utf-8');
})

class TestBotAnalyser implements IBotAnalyser {
	isUntrustedBot(username: string): boolean {
		return username === 'TEST_BOT_1' || username === 'TEST_BOT_2';
	}
}

class TestChatInterface implements IChatInterface {
	private connectedChannels: string[] = [];
	private joinListeners: ((channel: string, username: string, self: boolean) => void)[] = [];
	private messageListeners: ((channel: string, context: ChatUserstate, message: string, self: boolean) => void)[] = [];
	private log: string[][] = [];
	addJoinListener(func: (channel: string, username: string, self: boolean) => void): void {
		this.joinListeners.push(func);
	}
	addMessageListener(func: (channel: string, context: ChatUserstate, message: string, self: boolean) => void): void {
		this.messageListeners.push(func);
	}
	getConnectedChannels(): string[] {
		return this.connectedChannels;
	}
	banBot(channel: string, username: string): void {
		this.log.push(['BAN', channel, username]);
	}
	join(channel: string): void {
		this.log.push(['JOIN', channel]);
	}
	part(channel: string): void {
		this.log.push(['PART', channel]);
	}
	say(channel: string, message: string): void {
		this.log.push(['SAY', channel, message]);
	}

	simulateJoin(channel: string, username: string, self: boolean): void {
		if(self) {
			this.connectedChannels.push(channel);
		}

		this.joinListeners.forEach((func) => func(channel, username, self));
	}

	simulateMessage(channel: string, context: ChatUserstate, message: string, self: boolean): void {
		this.messageListeners.forEach((func) => func(channel, context, message, self));
	}

	getLog(): string[][] {
		return this.log;
	}
}

function CreateTestModBot(chat: IChatInterface): ModBot {
	return new ModBot(
		TestModBotUsername,
		new TestBotAnalyser(),
		chat,
		'./test/testVerbosity.json',
		'./test/testFollowerMessages.json'
	);
}

describe('Bot Commands', () => {
	it('!check non-bot', () => {
		const chat: TestChatInterface = new TestChatInterface();
		CreateTestModBot(chat);
		chat.simulateMessage(
			TestChannel,
			TestContext,
			'!check TEST_NON_BOT',
			false
		);
		expect(chat.getLog()).to.eql([
			['SAY', TestChannel, 'TEST_NON_BOT does not seem to be an untrusted bot']
		]);
	});

	it('!check non-bot (quiet)', () => {
		const chat: TestChatInterface = new TestChatInterface();
		CreateTestModBot(chat);
		chat.simulateMessage(
			TestChannel,
			TestContext,
			'!quiet',
			false
		);
		chat.simulateMessage(
			TestChannel,
			TestContext,
			'!check TEST_NON_BOT',
			false
		);
		expect(chat.getLog()).to.eql([
			['SAY',	TestChannel, 'TEST_NON_BOT does not seem to be an untrusted bot']
		]);
	});

	it('!check bot', () => {
		const chat: TestChatInterface = new TestChatInterface();
		CreateTestModBot(chat);
		chat.simulateMessage(
			TestChannel,
			TestContext,
			'!check TEST_BOT_2',
			false
		);
		expect(chat.getLog()).to.eql([
			['SAY', TestChannel, 'TEST_BOT_2 seems to be an untrusted bot']
		]);
	});

	it('!check bot (quiet)', () => {
		const chat: TestChatInterface = new TestChatInterface();
		CreateTestModBot(chat);
		chat.simulateMessage(
			TestChannel,
			TestContext,
			'!quiet',
			false
		);
		chat.simulateMessage(
			TestChannel,
			TestContext,
			'!check TEST_BOT_2',
			false
		);
		expect(chat.getLog()).to.eql([
			['SAY', TestChannel,'TEST_BOT_2 seems to be an untrusted bot']
		]);
	});

	it('!check no name', () => {
		const chat: TestChatInterface = new TestChatInterface();
		CreateTestModBot(chat);
		chat.simulateMessage(
			TestChannel,
			TestContext,
			'!check',
			false
		);
		expect(chat.getLog()).to.eql([
			['SAY', TestChannel, 'check requires a name']
		]);
	});

	it('!check no name (quiet)', () => {
		const chat: TestChatInterface = new TestChatInterface();
		CreateTestModBot(chat);
		chat.simulateMessage(
			TestChannel,
			TestContext,
			'!quiet',
			false
		);
		chat.simulateMessage(
			TestChannel,
			TestContext,
			'!check',
			false
		);
		expect(chat.getLog()).to.eql([
			['SAY',TestChannel,'check requires a name']
		]);
	});

	it('!join valid', () => {
		const chat: TestChatInterface = new TestChatInterface();
		CreateTestModBot(chat);
		chat.simulateMessage(
			TestChannel,
			{'display-name': TestModBotUsername},
			'!join OTHER_CHANNEL',
			false
		);
		expect(chat.getLog()).to.eql([
			['JOIN', 'OTHER_CHANNEL']
		]);
	});

	it('!join valid (quiet)', () => {
		const chat: TestChatInterface = new TestChatInterface();
		CreateTestModBot(chat);
		chat.simulateMessage(
			TestChannel,
			TestContext,
			'!quiet',
			false
		);
		chat.simulateMessage(
			TestChannel,
			{'display-name': TestModBotUsername},
			'!join OTHER_CHANNEL',
			false
		);
		expect(chat.getLog()).to.eql([
			['JOIN', 'OTHER_CHANNEL']
		]);
	});

	it('!join no channel', () => {
		const chat: TestChatInterface = new TestChatInterface();
		CreateTestModBot(chat);
		chat.simulateMessage(
			TestChannel,
			{'display-name': TestModBotUsername},
			'!join',
			false
		);
		expect(chat.getLog()).to.eql([]);
	});

	it('!join no channel (quiet)', () => {
		const chat: TestChatInterface = new TestChatInterface();
		CreateTestModBot(chat);
		chat.simulateMessage(
			TestChannel,
			TestContext,
			'!quiet',
			false
		);
		chat.simulateMessage(
			TestChannel,
			{'display-name': TestModBotUsername},
			'!join',
			false
		);
		expect(chat.getLog()).to.eql([]);
	});

	it('!join without permission', () => {
		const chat: TestChatInterface = new TestChatInterface();
		CreateTestModBot(chat);
		chat.simulateMessage(
			TestChannel,
			TestContext,
			'!join OTHER_CHANNEL',
			false
		);
		expect(chat.getLog()).to.eql([]);
	});

	it('!join without permission (quiet)', () => {
		const chat: TestChatInterface = new TestChatInterface();
		CreateTestModBot(chat);
		chat.simulateMessage(
			TestChannel,
			TestContext,
			'!quiet',
			false
		);
		chat.simulateMessage(
			TestChannel,
			TestContext,
			'!join OTHER_CHANNEL',
			false
		);
		expect(chat.getLog()).to.eql([]);
	});

	it('!ping', () => {
		const chat: TestChatInterface = new TestChatInterface();
		CreateTestModBot(chat);
		chat.simulateMessage(
			TestChannel,
			TestContext,
			'!ping',
			false
		);
		expect(chat.getLog()).to.eql([
			['SAY', TestChannel, "pong!"]
		]);
	});

	it('!ping (quiet)', () => {
		const chat: TestChatInterface = new TestChatInterface();
		CreateTestModBot(chat);
		chat.simulateMessage(
			TestChannel,
			TestContext,
			'!quiet',
			false
		);
		chat.simulateMessage(
			TestChannel,
			TestContext,
			'!ping',
			false
		);
		expect(chat.getLog()).to.eql([
			['SAY', TestChannel, "pong!"]
		]);
	});

	it('!stop', () => {
		const chat: TestChatInterface = new TestChatInterface();
		CreateTestModBot(chat);
		chat.simulateMessage(
			TestChannel,
			TestContext,
			'!stop',
			false
		);
		expect(chat.getLog()).to.eql([
			['SAY', TestChannel, 'Bye!'],
			['PART', TestChannel]
		]);
	});

	it('!stop (quiet)', () => {
		const chat: TestChatInterface = new TestChatInterface();
		CreateTestModBot(chat);
		chat.simulateMessage(
			TestChannel,
			TestContext,
			'!quiet',
			false
		);
		chat.simulateMessage(
			TestChannel,
			TestContext,
			'!stop',
			false
		);
		expect(chat.getLog()).to.eql([
			['SAY', TestChannel, 'Bye!'],
			['PART', TestChannel]
		]);
	});

	it('non-bot joins', () => {
		const chat: TestChatInterface = new TestChatInterface();
		CreateTestModBot(chat);
		chat.simulateJoin(
			TestChannel,
			'TEST_NOT_A_BOT',
			false
		);
		expect(chat.getLog()).to.eql([]);
	});

	it('non-bot joins (quiet)', () => {
		const chat: TestChatInterface = new TestChatInterface();
		CreateTestModBot(chat);
		chat.simulateMessage(
			TestChannel,
			TestContext,
			'!quiet',
			false
		);
		chat.simulateJoin(
			TestChannel,
			'TEST_NOT_A_BOT',
			false
		);
		expect(chat.getLog()).to.eql([]);
	});

	it('bot joins', () => {
		const chat: TestChatInterface = new TestChatInterface();
		CreateTestModBot(chat);
		chat.simulateJoin(
			TestChannel,
			'TEST_BOT_1',
			false
		);
		expect(chat.getLog()).to.eql([
			['SAY', TestChannel, 'TEST_BOT_1 has registered as an untrusted bot, autobanning'],
			['BAN', TestChannel, 'TEST_BOT_1']
		]);
	});

	it('bot joins (quiet)', () => {
		const chat: TestChatInterface = new TestChatInterface();
		CreateTestModBot(chat);
		chat.simulateMessage(
			TestChannel,
			TestContext,
			'!quiet',
			false
		);
		chat.simulateJoin(
			TestChannel,
			'TEST_BOT_1',
			false
		);
		expect(chat.getLog()).to.eql([
			['BAN', TestChannel, 'TEST_BOT_1']
		]);
	});

	it('non-bot follow message', () => {
		const chat: TestChatInterface = new TestChatInterface();
		CreateTestModBot(chat);
		chat.simulateMessage(
			TestChannel,
			{'display-name': TestGoodChatBot},
			'STARTTEST_NON_BOTEND',
			false
		);
		expect(chat.getLog()).to.eql([
			['SAY', TestChannel, 'TEST_NON_BOT does not appear to be an untrusted bot. Welcome! (This welcome was sent automatically)']
		]);
	});

	it('non-bot follow message (quiet)', () => {
		const chat: TestChatInterface = new TestChatInterface();
		CreateTestModBot(chat);
		chat.simulateMessage(
			TestChannel,
			TestContext,
			'!quiet',
			false
		);
		chat.simulateMessage(
			TestChannel,
			{'display-name': TestGoodChatBot},
			'STARTTEST_NON_BOTEND',
			false
		);
		expect(chat.getLog()).to.eql([]);
	});

	it('bot follow message', () => {
		const chat: TestChatInterface = new TestChatInterface();
		CreateTestModBot(chat);
		chat.simulateMessage(
			TestChannel,
			{'display-name': TestGoodChatBot},
			'STARTTEST_BOT_1END',
			false
		);
		expect(chat.getLog()).to.eql([
			['SAY', TestChannel, 'TEST_BOT_1 has registered as an untrusted bot, autobanning'],
			['BAN', TestChannel, 'TEST_BOT_1']
		]);
	});

	it('bot follow message (quiet)', () => {
		const chat: TestChatInterface = new TestChatInterface();
		CreateTestModBot(chat);
		chat.simulateMessage(
			TestChannel,
			TestContext,
			'!quiet',
			false
		);
		chat.simulateMessage(
			TestChannel,
			{'display-name': TestGoodChatBot},
			'STARTTEST_BOT_1END',
			false
		);
		expect(chat.getLog()).to.eql([
			['BAN', TestChannel, 'TEST_BOT_1']
		]);
	});

	it('non-command non-follow message', () => {
		const chat: TestChatInterface = new TestChatInterface();
		CreateTestModBot(chat);
		chat.simulateMessage(
			TestChannel,
			TestContext,
			'A normal message',
			false
		);
		expect(chat.getLog()).to.eql([]);
	});

	it('non-command non-follow message (quiet)', () => {
		const chat: TestChatInterface = new TestChatInterface();
		CreateTestModBot(chat);
		chat.simulateMessage(
			TestChannel,
			TestContext,
			'!quiet',
			false
		);
		chat.simulateMessage(
			TestChannel,
			TestContext,
			'A normal message',
			false
		);
		expect(chat.getLog()).to.eql([]);
	});

	it('non-command non-follow chatbot message', () => {
		const chat: TestChatInterface = new TestChatInterface();
		CreateTestModBot(chat);
		chat.simulateMessage(
			TestChannel,
			{'display-name': TestGoodChatBot},
			'A normal message',
			false
		);
		expect(chat.getLog()).to.eql([]);
	});

	it('non-command non-follow chatbot message (quiet)', () => {
		const chat: TestChatInterface = new TestChatInterface();
		CreateTestModBot(chat);
		chat.simulateMessage(
			TestChannel,
			TestContext,
			'!quiet',
			false
		);
		chat.simulateMessage(
			TestChannel,
			{'display-name': TestGoodChatBot},
			'A normal message',
			false
		);
		expect(chat.getLog()).to.eql([]);
	});

	//TODO add self check to join
})