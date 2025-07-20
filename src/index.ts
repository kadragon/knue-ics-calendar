import { ICalCalendar } from "ical-generator";
import { getEventsFromSite } from './parser'; // ❶ 사이트 파싱 로직

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
    console.log("Scheduled function called!");
    const currentYear = new Date().getFullYear();
    const events = await getEventsFromSite(currentYear);

    const calendar = new ICalCalendar({
      name: "한국교원대학교 학사/행사 일정",
      prodId: "-//Github@kadragon//haksaICS//KO",
      timezone: "Asia/Seoul",
      url: "https://github.com/kadragon/haksaICS",
    });

    events.forEach((event) => {
      calendar.createEvent({
        start: event.start,
        end: event.end,
        summary: event.title,
      });
    });

    const icsString = calendar.toString();
    await env.CAL_KV.put("latest", icsString);
    console.log("ICS generated and saved to KV!");
  },
};

interface Env {
  CAL_KV: KVNamespace;
}
