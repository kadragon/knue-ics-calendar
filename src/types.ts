export interface Event {
	start: Date;
	end: Date;
	title: string;
	url?: string;
}

export interface Env {
	KNUE_CAL_KV: KVNamespace;
	GITHUB_TOKEN?: string;
	GIST_ID?: string;
	GIST_FILENAME?: string;
}
