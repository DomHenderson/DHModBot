import fs from 'fs';

let verbosityLevels: Map<string, string> = new Map<string, string>();

loadLevels();

export function getQuiet(channel: string): boolean {
	console.log(`Checking quietness for ${channel}`);
	return verbosityLevels.get(channel) == 'quiet';
}

export function setLoud(channel: string): void {
	setVerbosity(channel, 'loud');
}

export function setQuiet(channel: string): void {
	setVerbosity(channel, 'quiet');
}

function setVerbosity(channel: string, level: string): void {
	verbosityLevels.set(channel, level);
	saveLevels();
}

function loadLevels() {
	verbosityLevels.clear();
	const json = JSON.parse(fs.readFileSync('./src/secret/verbosity.json', 'utf-8'));
	for(let value in json) {
		verbosityLevels.set(value, json[value]);
	}
}

function saveLevels() {
	let json: any = {};
	verbosityLevels.forEach((value, key) => {
		json[key] = value;
	})
	fs.writeFileSync('./src/secret/verbosity.json', JSON.stringify(json, null, 4), 'utf8');
}