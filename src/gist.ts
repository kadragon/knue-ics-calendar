import { log } from "./utils/logger";

/**
 * Update a GitHub Gist with ICS content.
 * Non-fatal: logs errors but never throws.
 */
export async function updateGist(
	token: string,
	gistId: string,
	icsContent: string,
): Promise<void> {
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
				"knue-calendar.ics": {
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
		});
		return;
	}

	log("info", "Gist updated successfully");
}
