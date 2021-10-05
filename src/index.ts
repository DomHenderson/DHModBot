import { ViewFollowChecker } from './botAnalysis';
import { ModBot } from './modbot';
import { RecentFollowChecker } from './recentFollowChecker';
import { TwitchInterface } from './chatInterface';
import { UpdateBotList } from './UpdateBotList';
import { ClientId, ClientOptions, OAuthToken } from './secret/secrets';
import { ITwitchAPI, TwitchAPI } from './twitchApi';

UpdateBotList();
setInterval(UpdateBotList, 15*60*1000);
const botAnalyser: ViewFollowChecker = new ViewFollowChecker('./list.json');
const chatInterface: TwitchInterface = new TwitchInterface(ClientOptions);
const modBot: ModBot = new ModBot(
	ClientOptions.identity?.username ?? '',
	botAnalyser,
	chatInterface,
	'./src/secret/verbosity.json',
	'./src/secret/followerMessages.json'
);
const twitchAPI: ITwitchAPI = new TwitchAPI(ClientId, OAuthToken);
const RFC = new RecentFollowChecker(
	chatInterface,
	twitchAPI
);
setInterval(() => {RFC.checkRecentFollows(chatInterface.getConnectedChannels())}, 15*60*1000);