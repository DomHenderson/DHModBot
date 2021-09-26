import fs from 'fs';
import { FollowData, TwitchInterface } from './twitchInterface';

export class RecentFollowChecker {
	private readonly recentFollowMap: Map<string, FollowData>;
	private readonly recentFollowMapPath: string = './src/secret/recentFollows.json';
	private readonly TI: TwitchInterface;

	constructor(
		TI: TwitchInterface
	) {
		this.recentFollowMap = new Map(JSON.parse(
			fs.readFileSync(this.recentFollowMapPath, 'utf-8')
		));

		this.TI = TI;
	}

	async checkRecentFollows(channelNames: string[]): Promise<void> {
		const unfilteredChannels = await Promise.all(channelNames.map(
				async(channelName: string) => {
					return {
						id: await this.TI.getUserID(channelName),
						name: channelName
					};
				}
		));
			
		const channels = unfilteredChannels.filter(
			(data): data is {id: string, name: string} => data.id !== undefined
		);

		const recentFollows = await Promise.all(channels.map(async ({id, name}) => {
			const checkedFollow: FollowData|undefined = this.recentFollowMap.get(id);
			
			if(!checkedFollow) {
				let recentFollows: FollowData[]|undefined = await this.TI.getRecentFollowers(id);
				if(recentFollows !== undefined && recentFollows !== []) {
					this.recentFollowMap.set(id, recentFollows[0]);
				}
				return Promise.resolve({
					channel: {id, name},
					follows: []
				});
			}

			const checkedFollowDate = new Date(checkedFollow.followed_at);
			const follows = await this.TI.getFollowersSince(id, checkedFollowDate);
			return {
				channel: {id, name},
				follows: follows
			};
		}));

		recentFollows.forEach(({channel, follows}) => {
			console.log(channel);
			console.log(follows);
			if(follows && follows.length > 0 && this.TI.getConnectedChannels().includes(channel.name)) {
				this.recentFollowMap.set(channel.id, follows[0]);
			}
		});

		this.saveRecentFollowMap();

		const followRates = await Promise.all(recentFollows.map(async ({channel, follows}) => {
			const followData = await Promise.all(follows.map(async(follow) => {
				const time = await this.TI.getTimeBetweenFollows(follow.from_id);
				return {
					name: follow.from_name,
					followTime: time
				};
			}));

			return {
				channel: channel,
				followers: followData
			};
		}));

		console.log(JSON.stringify(followRates, null, 4));

		const cutoffTime = 60000;

		const toBan = followRates
			.flatMap(({channel, followers}) => {
				return followers.map(({name, followTime}) => {
					return {
						broadcaster: channel.name,
						follower: name,
						followTime: followTime
					};
				})
			})
			.filter(({broadcaster, follower, followTime}) => {
				return followTime && followTime < cutoffTime;
			})
			.map(({broadcaster, follower, followTime}) => {return {broadcaster, follower};});

		toBan.forEach(({broadcaster, follower}) => {
			if(this.TI.getConnectedChannels().includes(broadcaster)) {
				this.TI.banBot(broadcaster, follower);
			}
		});
	}

	saveRecentFollowMap() {
		let mapData: any[] = [];
		let i = 0;
		this.recentFollowMap.forEach((value, key) => {
			mapData[i++] = [key, value];
		});
		fs.writeFileSync(this.recentFollowMapPath, JSON.stringify(mapData, null, 4), 'utf-8');
	}
}
