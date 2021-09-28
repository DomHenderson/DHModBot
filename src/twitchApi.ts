import axios, { AxiosRequestConfig } from "axios";

export interface ITwitchAPI {
	getUserID(username: string): Promise<string|undefined>;
	getRecentFollowers(userId: string): Promise<FollowData[]|undefined>;
	getFollowersSince(userId: string, date: Date): Promise<FollowData[]>;
	getAllFollowers(userId: string): Promise<FollowData[]>;
	getUsersFollowedBy(userId: string): Promise<FollowData[]|undefined>;
	getTimeBetweenFollows(userId: string): Promise<number|undefined>;
}

export class TwitchAPI implements ITwitchAPI {
	private twitchAPIConfig: AxiosRequestConfig;

	constructor(clientId: string, oAuthToken: string) {
		this.twitchAPIConfig = {
			headers: {
				Authorization: `Bearer ${oAuthToken}`,
				'Client-Id': clientId
			}
		};
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
		console.log(res.data);
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