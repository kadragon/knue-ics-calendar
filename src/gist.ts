import { log } from "./utils/logger";

const GIST_ID_RE = /^[0-9a-fA-F]{20,40}$/;

/**
 * Update a GitHub Gist with ICS content.
 * Non-fatal: logs errors but never throws.
 */
export async function updateGist(
	token: string,
	gistId: string,
	icsContent: string,
	filename = "knue-calendar.ics",
): Promise<void> {
	if (!GIST_ID_RE.test(gistId)) {
		log("error", "Invalid gistId format", { gistIdLength: gistId.length });
		return;
	}

	try {
		const url = `https://api.github.com/gists/${gistId}`;
		const res = await fetch(url, {
			method: "PATCH",
			headers: {
				authorization: `Bearer ${token}`,
				accept: "application/vnd.github+json",
				"user-agent": "KNUE-ICS-Calendar/1.0.0",
			},
			body: JSON.stringify({
				files: {
					[filename]: {
						content: icsContent,
					},
				},
			}),
		});

		if (!res.ok) {
			const body = await res.text();
			log("error", "Gist update failed", {
				status: res.status,
				body: body.slice(0, 200),
				gistId,
			});
			return;
		}

		log("info", "Gist updated successfully");
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : String(err);
		log("error", "Gist update error", { error: message, gistId });
	}
}
