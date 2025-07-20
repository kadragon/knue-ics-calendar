import { ICalCalendar } from "ical-generator";
// import { getEventsFromSite } from './parser'; // ❶ 사이트 파싱 로직

export default {
  async fetch(req: Request, env: Env) {
    if (new URL(req.url).pathname.endsWith(".ics")) {
      const ics = await env.CAL_KV.get("latest", "text");
      return new Response(ics, {
        headers: {
          "content-type": "text/calendar; charset=utf-8",
          "cache-control": "public, max-age=300",
          "content-disposition": 'attachment; filename="events.ics"',
        },
      });
    }
    return new Response("Not found", { status: 404 });
  },

  // Cron Trigger
  async scheduled(_evt: ScheduledController, env: Env) {
    // const events = await getEventsFromSite();         // ❷ 최신 데이터 크롤링
    const cal = new ICalCalendar({ name: "KNUE ICS" });

    // events.forEach(e => cal.createEvent({
    //   start: e.start,
    //   end:   e.end,
    //   summary: e.title,
    //   url: e.url,
    // }));

    await env.CAL_KV.put("latest", cal.toString()); // ❸ KV에 저장
  },
};

interface Env {
  CAL_KV: KVNamespace;
}
