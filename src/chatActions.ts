export class ChatAction {};

export class BanBot extends ChatAction {
	constructor(
		public channel: string,
		public username: string
	) {
		super();
	}
}

export class Join extends ChatAction {
	constructor(public channel: string) {
		super();
	}
}

export class Part extends ChatAction {
	constructor(public channel: string) {
		super();
	}
}

export class Say extends ChatAction {
	constructor(
		public channel: string,
		public message: string
	) {
		super();
	}
}