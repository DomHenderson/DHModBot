import { ModBot } from './modbot';
import { TwitchInterface } from './twitchInterface';
import { UpdateBotList } from './UpdateBotList';

UpdateBotList();
setInterval(UpdateBotList, 5*60*1000);
let modBot: ModBot = new ModBot('./list.json', './src/secret/verbosity.json', './src/secret/followerMessages.json');
new TwitchInterface(modBot);