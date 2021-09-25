import axios from 'axios';
import fs from 'fs';
import { ClientId, OAuthToken } from './secret/secrets';

type FollowData = {
	from_name: string;
	from_id: string;
	followed_at: string;
	to_name: string;
};

const recentFollowMap: Map<string, FollowData> = new Map(JSON.parse(
	fs.readFileSync('./src/secret/recentFollows.json', 'utf-8')
));

export async function UpdateRecentFollowList() {
	recentFollowMap.forEach(async (mostRecentCheckedFollower: FollowData, userId: string) => {
		{
		// const mostRecentCheckedFollow = recentFollowMap.get(userId);
		// if(!mostRecentCheckedFollow) continue;

		// let config = {
		// 	headers: {
		// 		Authorization: `Bearer ${OAuthToken}`,
		// 		'Client-Id': ClientId
		// 	}
		// };
		// let res = await axios.get(`https://api.twitch.tv/helix/users/follows?to_id=${userId}`, config);
		// const uncheckedFollows: FollowData[] = res.data;
		// if(!uncheckedFollows) continue;

		// let follow: FollowData;
		// for(let i = 0; i < uncheckedFollows.length; ++i) {
		// 	follow = uncheckedFollows[i];
		// 	if(follow.from_id === mostRecentCheckedFollow.from_id) {
		// 		break;
		// 	}

		// 	if(new Date(follow.followed_at) > new Date(mostRecentCheckedFollow.followed_at)) {
		// 		console.log(`new follower`)
		// 	}
		// }
		}

		console.log('Most recent checked follower:');
		console.log(mostRecentCheckedFollower);

		//Get most recent followers from twitch
		let config = {
			headers: {
				Authorization: `Bearer ${OAuthToken}`,
				'Client-Id': ClientId
			}
		};
		const res = await axios.get(`https://api.twitch.tv/helix/users/follows?to_id=${userId}`, config);
		const mostRecentFollowers: FollowData[]|undefined = res.data.data;
		if(!mostRecentFollowers) {
			console.log('most recent = undefined');
			return;
		}

		//Save most recent follower as most recent checked
		recentFollowMap.set(userId, mostRecentFollowers[0]);
		saveRecentFollowMap();

		//while followerID not equal, and follower to check is more recent than checked follow
		let i: number = 0;
		for(;
			mostRecentFollowers[i].from_id !== mostRecentCheckedFollower.from_id &&
			new Date(mostRecentFollowers[i].followed_at) > new Date(mostRecentCheckedFollower.followed_at) &&
			i < mostRecentFollowers.length;
			++i
		) {
			console.log(mostRecentFollowers[i].from_name);
			//get most recent follows from twitch
			const followsRes = await axios.get(`https://api.twitch.tv/helix/users/follows?from_id=${mostRecentFollowers[i].from_id}`, config);
			const follows = followsRes.data.data;
			console.log(follows);
			//print names and times of recent follows
			console.log(`${mostRecentFollowers[i].from_name} followed ${mostRecentFollowers[i].to_name}`);
			console.log(`	${followsRes.data.total} total follows`);
			for(let j = 0; j < follows.length; ++j) {
				console.log(`	${follows[j].followed_at}`);
			}
		}
	});

	console.log(recentFollowMap.keys());
	console.log(recentFollowMap.get("472878650"));
}

function saveRecentFollowMap() {
	let arr: [string, FollowData][] = [];

	recentFollowMap.forEach((value, key) => {
		arr.push([key, value]);
	});

	fs.writeFileSync('./src/secret/recentFollows.json', JSON.stringify(arr, null, 4), 'utf-8');
}