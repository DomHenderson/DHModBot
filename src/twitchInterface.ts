import axios, { AxiosRequestConfig } from 'axios';
import tmi from 'tmi.js';
import { BanBot, ChatAction, Join, Part, Say } from './chatActions';
import { IModBot } from './modbot';
import { ClientId, ClientOptions, OAuthToken } from './secret/secrets';

export class TwitchInterface {
	private modBot: IModBot;
	private client: tmi.Client;
	private twitchAPIConfig: AxiosRequestConfig;
	private connectedChannels: string[] = [];

	constructor(
		behaviour: IModBot
	) {
		this.modBot = behaviour;
		this.client = new tmi.client(ClientOptions)
		this.twitchAPIConfig = {
			headers: {
				Authorization: `Bearer ${OAuthToken}`,
				'Client-Id': ClientId
			}
		};


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
		if(self) {
			if(!this.connectedChannels.includes(channel)) {
				this.connectedChannels.push(channel);
				console.log(this.connectedChannels);
			}
		} else {
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
				console.log(`Leaving ${action.channel}`);
				if(this.connectedChannels.includes(action.channel)) {
					this.connectedChannels = this.connectedChannels.filter((x) => x !== action.channel);
				}
				console.log(`now in channels ${this.connectedChannels.toString()}`);
			} else if (action instanceof Say) {
				this.say(action.channel, action.message, true);
			}
		}
	}

	getConnectedChannels(): string[] {
		return this.connectedChannels;
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
		console.log(`	Sending(${channel}): ${message}`);
		this.client.say(channel, `/me ${message}`);
	}

	async getUserID(username: string): Promise<string|undefined> {
		if(username.length === 0) return Promise.resolve(undefined);
		if(username[0] === '#') username = username.slice(1);
		
		const res = await axios.get(`https://api.twitch.tv/helix/users?login=${username}`, this.twitchAPIConfig);
		return res?.data?.data[0]?.id;
	}

	async getRecentFollowers(userId: string): Promise<FollowData[]|undefined> {
		const res: FollowDataRes = await axios.get(`https://api.twitch.tv/helix/users/follows?to_id=${userId}`, this.twitchAPIConfig);
		return res.data?.data;
	}

	async getFollowersSince(userId: string, date: Date): Promise<FollowData[]> {
		console.log(`Getting followers of ${userId} since ${date.toString()}`);
		let followers: FollowData[] = [];

		let res: FollowDataRes = await axios.get(`https://api.twitch.tv/helix/users/follows?to_id=${userId}`, this.twitchAPIConfig);
		if(res.data?.data === undefined || res.data.data.length === 0) return Promise.resolve([]);
		followers.push(...res.data.data);

		while(
			new Date(followers[followers.length-1].followed_at) > date &&
			res.data?.pagination.cursor !== undefined
		) {
			res = await axios.get(`https://api.twitch.tv/helix/users/follows?to_id=${userId}&after=${res.data.pagination.cursor}`, this.twitchAPIConfig);
			if(res.data) {
				followers.push(...res.data.data);
			}
		}

		return followers
			.filter((follow: FollowData) => {
				return new Date(follow.followed_at) > date;
			});
	}

	async getAllFollowers(userId: string): Promise<FollowData[]> {
		let res: FollowDataRes = await axios.get(`https://api.twitch.tv/helix/users/follows?to_id=${userId}`, this.twitchAPIConfig);
		let cursor: string|undefined = res?.data?.pagination?.cursor;
		let followers: FollowData[] = [];
		if(res.data?.data === undefined || res.data.data.length === 0) return Promise.resolve([]);
		followers.push(...res.data.data);

		while(cursor !== undefined) {
			res = await axios.get(`https://api.twitch.tv/helix/users/follows?to_id=${userId}&after=${cursor}`, this.twitchAPIConfig);
			cursor = res?.data?.pagination?.cursor;
			if(res.data) {
				followers.push(...res.data.data);
			}
		}

		return followers;
	}

	async getUsersFollowedBy(userId: string): Promise<FollowData[]|undefined> {
		const res: FollowDataRes = await axios.get(`https://api.twitch.tv/helix/users/follows?from_id=${userId}`, this.twitchAPIConfig);
		return res.data?.data;
	}

	async getTimeBetweenFollows(userId: string): Promise<number|undefined> {
		const follows = await this.getUsersFollowedBy(userId);
		if(follows === undefined || follows.length < 2) return undefined;
		let gaps = [];
		for(let i = 0; i+1 < follows.length; ++i) {
			const laterDate = new Date(follows[i].followed_at);
			const earlierDate = new Date(follows[i+1].followed_at);
			gaps[i] = laterDate.valueOf() - earlierDate.valueOf();
		}

		const half = Math.floor(gaps.length/2);
		return gaps.length % 2
			? gaps[half]
			: (gaps[half] + gaps[half+1])/2.0;
	}
}

type FollowDataRes = {
	status: number,
	data: {
		total: number;
		data: FollowData[];
		pagination: {
			cursor: string|undefined
		}
	}|undefined;
};

export type FollowData = {
	from_id: string,
	from_login: string,
	from_name: string,
	to_id: string,
	to_login: string,
	to_name: string,
	followed_at: string
};