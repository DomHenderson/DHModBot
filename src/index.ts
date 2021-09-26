import { ViewFollowChecker } from './botAnalysis';
import { ModBot } from './modbot';
import { RecentFollowChecker } from './recentFollowChecker';
import { TwitchInterface } from './twitchInterface';
import { UpdateBotList } from './UpdateBotList';

UpdateBotList();
setInterval(UpdateBotList, 5*60*1000);
let botAnalyser: ViewFollowChecker = new ViewFollowChecker('./list.json');
let modBot: ModBot = new ModBot(
	'./src/secret/verbosity.json',
	'./src/secret/followerMessages.json',
	botAnalyser
);
const TI: TwitchInterface = new TwitchInterface(modBot);
const RFC = new RecentFollowChecker(TI);
setInterval(() => {RFC.checkRecentFollows(TI.getConnectedChannels())}, 15*60*1000);