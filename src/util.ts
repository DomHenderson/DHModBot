import { FollowData, ITwitchAPI } from "./twitchApi";

export async function printFollows(twitch: ITwitchAPI, name: string): Promise<void> {
	const id: string|undefined = await twitch.getUserID(name);
	if(!id) {
		console.log(`${name} not found`);
		return;
	}

	const follows: FollowData[]|undefined = await twitch.getUsersFollowedBy(name);
	if(follows) {
		console.log(JSON.stringify(follows,null,4));
	}
}