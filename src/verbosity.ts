import fs from 'fs';

let verbosityLevels: Map<string, string> = JSON.parse(fs.readFileSync('./src/secret/verbosity.json', 'utf-8'));

export function getQuiet(channel: string): boolean {
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
	fs.writeFileSync('verbosity.json', JSON.stringify(verbosityLevels, null, 4), 'utf8');
}