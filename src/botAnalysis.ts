import fs from 'fs';

export interface IBotAnalyser {
	isUntrustedBot(username: string): boolean;
}

export class ViewFollowChecker implements IBotAnalyser{
	private viewBotList: string[];
	private botListPath: string;

	constructor(
		botListPath: string,
	) {
		this.botListPath = botListPath;
		this.viewBotList = JSON.parse(fs.readFileSync(this.botListPath, 'utf8'));
	}

	isUntrustedBot(username: string): boolean {
		return this.isViewingManyChannels(username);
	}

	isViewingManyChannels(username: string): boolean {
		return this.viewBotList.includes(username);
	}
}
