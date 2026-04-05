/**
 * 학사년도: 3월~익년 2월. 3월 이상이면 해당 연도, 1~2월이면 전년도.
 * CF Workers는 UTC 기준이므로 Asia/Seoul 타임존으로 변환하여 계산.
 */
export function getAcademicYear(date: Date): number {
	const koreaDate = new Date(
		date.toLocaleString("en-US", { timeZone: "Asia/Seoul" }),
	);
	const month = koreaDate.getMonth() + 1;
	return month >= 3 ? koreaDate.getFullYear() : koreaDate.getFullYear() - 1;
}

/**
 * 현재 학사년도와 이전 학사년도를 반환.
 * 두 학사년도를 fetch하면 연도 경계의 이벤트 누락을 방지할 수 있음.
 */
export function getAcademicYearsToFetch(date: Date): [number, number] {
	const current = getAcademicYear(date);
	return [current, current - 1];
}
