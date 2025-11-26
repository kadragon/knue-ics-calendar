type LogLevel = "info" | "warn" | "error";
type LogData = Record<string, unknown>;

export function log(level: LogLevel, message: string, data?: LogData): void {
	const timestamp = new Date().toISOString();
	const logData: Record<string, unknown> = {
		timestamp,
		level,
		message,
		...(data ? { data } : {}),
	};

	if (level === "error") {
		console.error(JSON.stringify(logData));
	} else if (level === "warn") {
		console.warn(JSON.stringify(logData));
	} else {
		console.log(JSON.stringify(logData));
	}
}
