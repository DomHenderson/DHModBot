import fs from 'fs';
import { expect } from 'chai';
import { BanBot, Join, Part, Say } from '../src/chatActions';
import { ModBot } from '../src/modbot';
import { ClientOptions } from '../src/secret/secrets';

afterEach(() => {
	fs.writeFileSync('./test/testVerbosity.json', '{}', 'utf-8');
})

describe('Bot Commands', () => {
	it('!check non-bot', () => {
		let modBot: ModBot = new ModBot('./test/testBotList.json', './test/testVerbosity.json', './test/testFollowerMessages.json');
		const result = modBot.processMessage(
			'TEST_CHANNEL',
			'!check TEST_NON_BOT',
			'TEST_SENDER',
			false
		);
		expect(result).to.eql(
			[new Say(
				'TEST_CHANNEL',
				'TEST_NON_BOT does not seem to be an untrusted bot'
			)]
		);
	});

	it('!check non-bot (quiet)', () => {
		let modBot: ModBot = new ModBot('./test/testBotList.json', './test/testVerbosity.json', './test/testFollowerMessages.json');
		modBot.processMessage(
			'TEST_CHANNEL',
			'!quiet',
			'TEST_SENDER',
			false
		);
		const result = modBot.processMessage(
			'TEST_CHANNEL',
			'!check TEST_NON_BOT',
			'TEST_SENDER',
			false
		);
		expect(result).to.eql(
			[new Say(
				'TEST_CHANNEL',
				'TEST_NON_BOT does not seem to be an untrusted bot'
			)]
		);
	});

	it('!check bot', () => {
		let modBot: ModBot = new ModBot('./test/testBotList.json', './test/testVerbosity.json', './test/testFollowerMessages.json');
		const result = modBot.processMessage(
			'TEST_CHANNEL',
			'!check TEST_BOT_2',
			'TEST_SENDER',
			false
		);
		expect(result).to.eql(
			[new Say(
				'TEST_CHANNEL',
				'TEST_BOT_2 seems to be an untrusted bot'
			)]
		);
	});

	it('!check bot (quiet)', () => {
		let modBot: ModBot = new ModBot('./test/testBotList.json', './test/testVerbosity.json', './test/testFollowerMessages.json');
		modBot.processMessage(
			'TEST_CHANNEL',
			'!quiet',
			'TEST_SENDER',
			false
		);
		const result = modBot.processMessage(
			'TEST_CHANNEL',
			'!check TEST_BOT_2',
			'TEST_SENDER',
			false
		);
		expect(result).to.eql(
			[new Say(
				'TEST_CHANNEL',
				'TEST_BOT_2 seems to be an untrusted bot'
			)]
		);
	});

	it('!check no name', () => {
		let modBot: ModBot = new ModBot('./test/testBotList.json', './test/testVerbosity.json', './test/testFollowerMessages.json');
		const result = modBot.processMessage(
			'TEST_CHANNEL',
			'!check',
			'TEST_SENDER',
			false
		);
		expect(result).to.eql(
			[new Say(
				'TEST_CHANNEL',
				'check requires a name'
			)]
		);
	});

	it('!check no name (quiet)', () => {
		let modBot: ModBot = new ModBot('./test/testBotList.json', './test/testVerbosity.json', './test/testFollowerMessages.json');
		modBot.processMessage(
			'TEST_CHANNEL',
			'!quiet',
			'TEST_SENDER',
			false
		);
		const result = modBot.processMessage(
			'TEST_CHANNEL',
			'!check',
			'TEST_SENDER',
			false
		);
		expect(result).to.eql(
			[new Say(
				'TEST_CHANNEL',
				'check requires a name'
			)]
		);
	});

	it('!join valid', () => {
		let modBot: ModBot = new ModBot('./test/testBotList.json', './test/testVerbosity.json', './test/testFollowerMessages.json');
		const result = modBot.processMessage(
			'TEST_CHANNEL',
			'!join OTHER_CHANNEL',
			ClientOptions.identity?.username,
			false
		);
		expect(result).to.eql(
			[new Join('OTHER_CHANNEL')]
		);
	});

	it('!join valid (quiet)', () => {
		let modBot: ModBot = new ModBot('./test/testBotList.json', './test/testVerbosity.json', './test/testFollowerMessages.json');
		modBot.processMessage(
			'TEST_CHANNEL',
			'!quiet',
			'TEST_SENDER',
			false
		);
		const result = modBot.processMessage(
			'TEST_CHANNEL',
			'!join OTHER_CHANNEL',
			ClientOptions.identity?.username,
			false
		);
		expect(result).to.eql(
			[new Join('OTHER_CHANNEL')]
		);
	});

	it('!join no channel', () => {
		let modBot: ModBot = new ModBot('./test/testBotList.json', './test/testVerbosity.json', './test/testFollowerMessages.json');
		const result = modBot.processMessage(
			'TEST_CHANNEL',
			'!join',
			ClientOptions.identity?.username,
			false
		);
		expect(result).to.eql([]);
	});

	it('!join no channel (quiet)', () => {
		let modBot: ModBot = new ModBot('./test/testBotList.json', './test/testVerbosity.json', './test/testFollowerMessages.json');
		modBot.processMessage(
			'TEST_CHANNEL',
			'!quiet',
			'TEST_SENDER',
			false
		);
		const result = modBot.processMessage(
			'TEST_CHANNEL',
			'!join',
			ClientOptions.identity?.username,
			false
		);
		expect(result).to.eql([]);
	});

	it('!join without permission', () => {
		let modBot: ModBot = new ModBot('./test/testBotList.json', './test/testVerbosity.json', './test/testFollowerMessages.json');
		const result = modBot.processMessage(
			'TEST_CHANNEL',
			'!join OTHER_CHANNEL',
			'TEST_SENDER',
			false
		);
		expect(result).to.eql([]);
	});

	it('!join without permission (quiet)', () => {
		let modBot: ModBot = new ModBot('./test/testBotList.json', './test/testVerbosity.json', './test/testFollowerMessages.json');
		modBot.processMessage(
			'TEST_CHANNEL',
			'!quiet',
			'TEST_SENDER',
			false
		);
		const result = modBot.processMessage(
			'TEST_CHANNEL',
			'!join OTHER_CHANNEL',
			'TEST_SENDER',
			false
		);
		expect(result).to.eql([]);
	});

	it('!ping', () => {
		let modBot: ModBot = new ModBot('./test/testBotList.json', './test/testVerbosity.json', './test/testFollowerMessages.json');
		const result = modBot.processMessage(
			'TEST_CHANNEL',
			'!ping',
			'TEST_SENDER',
			false
		);
		expect(result).to.eql(
			[new Say('TEST_CHANNEL', "pong!")]
		);
	});

	it('!ping (quiet)', () => {
		let modBot: ModBot = new ModBot('./test/testBotList.json', './test/testVerbosity.json', './test/testFollowerMessages.json');
		modBot.processMessage(
			'TEST_CHANNEL',
			'!quiet',
			'TEST_SENDER',
			false
		);
		const result = modBot.processMessage(
			'TEST_CHANNEL',
			'!ping',
			'TEST_SENDER',
			false
		);
		expect(result).to.eql(
			[new Say('TEST_CHANNEL', "pong!")]
		);
	});

	it('!stop', () => {
		let modBot: ModBot = new ModBot('./test/testBotList.json', './test/testVerbosity.json', './test/testFollowerMessages.json');
		const result = modBot.processMessage(
			'TEST_CHANNEL',
			'!stop',
			'TEST_SENDER',
			false
		);
		expect(result).to.eql(
			[
				new Say('TEST_CHANNEL', 'Bye!'),
				new Part('TEST_CHANNEL')
			]
		);
	});

	it('!stop (quiet)', () => {
		let modBot: ModBot = new ModBot('./test/testBotList.json', './test/testVerbosity.json', './test/testFollowerMessages.json');
		modBot.processMessage(
			'TEST_CHANNEL',
			'!quiet',
			'TEST_SENDER',
			false
		);
		const result = modBot.processMessage(
			'TEST_CHANNEL',
			'!stop',
			'TEST_SENDER',
			false
		);
		expect(result).to.eql(
			[
				new Say('TEST_CHANNEL', 'Bye!'),
				new Part('TEST_CHANNEL')
			]
		);
	});

	it('non-bot joins', () => {
		let modBot: ModBot = new ModBot('./test/testBotList.json', './test/testVerbosity.json', './test/testFollowerMessages.json');
		const result = modBot.processJoin(
			'TEST_CHANNEL',
			'TEST_NOT_A_BOT'
		);
		expect(result).to.eql([]);
	});

	it('non-bot joins (quiet)', () => {
		let modBot: ModBot = new ModBot('./test/testBotList.json', './test/testVerbosity.json', './test/testFollowerMessages.json');
		modBot.processMessage(
			'TEST_CHANNEL',
			'!quiet',
			'TEST_SENDER',
			false
		);
		const result = modBot.processJoin(
			'TEST_CHANNEL',
			'TEST_NOT_A_BOT'
		);
		expect(result).to.eql([]);
	});

	it('bot joins', () => {
		let modBot: ModBot = new ModBot('./test/testBotList.json', './test/testVerbosity.json', './test/testFollowerMessages.json');
		const result = modBot.processJoin(
			'TEST_CHANNEL',
			'TEST_BOT_1'
		);
		expect(result).to.eql([
			new Say(
				'TEST_CHANNEL',
				'TEST_BOT_1 has registered as an untrusted bot, autobanning'
			),
			new BanBot(
				'TEST_CHANNEL',
				'TEST_BOT_1'
			)
		]);
	});

	it('bot joins (quiet)', () => {
		let modBot: ModBot = new ModBot('./test/testBotList.json', './test/testVerbosity.json', './test/testFollowerMessages.json');
		modBot.processMessage(
			'TEST_CHANNEL',
			'!quiet',
			'TEST_SENDER',
			false
		);
		const result = modBot.processJoin(
			'TEST_CHANNEL',
			'TEST_BOT_1'
		);
		expect(result).to.eql([
			new BanBot(
				'TEST_CHANNEL',
				'TEST_BOT_1'
			)
		]);
	});

	it('non-bot follow message', () => {
		let modBot: ModBot = new ModBot('./test/testBotList.json', './test/testVerbosity.json', './test/testFollowerMessages.json');
		const result = modBot.processMessage(
			'TEST_CHANNEL',
			'STARTTEST_NON_BOTEND',
			'TEST_CHATBOT',
			false
		);
		expect(result).to.eql([
			new Say(
				'TEST_CHANNEL',
				'TEST_NON_BOT does not appear to be an untrusted bot. Welcome! (This welcome was sent automatically)'
			)
		]);
	});

	it('non-bot follow message (quiet)', () => {
		let modBot: ModBot = new ModBot('./test/testBotList.json', './test/testVerbosity.json', './test/testFollowerMessages.json');
		modBot.processMessage(
			'TEST_CHANNEL',
			'!quiet',
			'TEST_SENDER',
			false
		);
		const result = modBot.processMessage(
			'TEST_CHANNEL',
			'STARTTEST_NON_BOTEND',
			'TEST_CHATBOT',
			false
		);
		expect(result).to.eql([]);
	});

	it('bot follow message', () => {
		let modBot: ModBot = new ModBot('./test/testBotList.json', './test/testVerbosity.json', './test/testFollowerMessages.json');
		const result = modBot.processMessage(
			'TEST_CHANNEL',
			'STARTTEST_BOT_1END',
			'TEST_CHATBOT',
			false
		);
		expect(result).to.eql([
			new Say(
				'TEST_CHANNEL',
				'TEST_BOT_1 has registered as an untrusted bot, autobanning'
			),
			new BanBot(
				'TEST_CHANNEL',
				'TEST_BOT_1'
			)
		]);
	});

	it('bot follow message (quiet)', () => {
		let modBot: ModBot = new ModBot('./test/testBotList.json', './test/testVerbosity.json', './test/testFollowerMessages.json');
		modBot.processMessage(
			'TEST_CHANNEL',
			'!quiet',
			'TEST_SENDER',
			false
		);
		const result = modBot.processMessage(
			'TEST_CHANNEL',
			'STARTTEST_BOT_1END',
			'TEST_CHATBOT',
			false
		);
		expect(result).to.eql([
			new BanBot(
				'TEST_CHANNEL',
				'TEST_BOT_1'
			)
		]);
	});

	it('non-command non-follow message', () => {
		let modBot: ModBot = new ModBot('./test/testBotList.json', './test/testVerbosity.json', './test/testFollowerMessages.json');
		const result = modBot.processMessage(
			'TEST_CHANNEL',
			'A normal message',
			'TEST_SENDER',
			false
		);
		expect(result).to.eql([]);
	});

	it('non-command non-follow message (quiet)', () => {
		let modBot: ModBot = new ModBot('./test/testBotList.json', './test/testVerbosity.json', './test/testFollowerMessages.json');
		modBot.processMessage(
			'TEST_CHANNEL',
			'!quiet',
			'TEST_SENDER',
			false
		);
		const result = modBot.processMessage(
			'TEST_CHANNEL',
			'A normal message',
			'TEST_SENDER',
			false
		);
		expect(result).to.eql([]);
	});

	it('non-command non-follow chatbot message', () => {
		let modBot: ModBot = new ModBot('./test/testBotList.json', './test/testVerbosity.json', './test/testFollowerMessages.json');
		const result = modBot.processMessage(
			'TEST_CHANNEL',
			'A normal message',
			'TEST_CHATBOT',
			false
		);
		expect(result).to.eql([]);
	});

	it('non-command non-follow chatbot message (quiet)', () => {
		let modBot: ModBot = new ModBot('./test/testBotList.json', './test/testVerbosity.json', './test/testFollowerMessages.json');
		modBot.processMessage(
			'TEST_CHANNEL',
			'!quiet',
			'TEST_SENDER',
			false
		);
		const result = modBot.processMessage(
			'TEST_CHANNEL',
			'A normal message',
			'TEST_CHATBOT',
			false
		);
		expect(result).to.eql([]);
	});

	//TODO add self check to join
})