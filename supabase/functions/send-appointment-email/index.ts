import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  vehicle_id: string;
  title: string;
  event_date: string;
  type: string;
  notes?: string | null;
}

function buildIcs(params: {
  uid: string;
  title: string;
  date: string; // YYYY-MM-DD
  description: string;
}): string {
  // All-day event: next day as DTEND
  const [y, m, d] = params.date.split("-").map(Number);
  const pad = (n: number) => String(n).padStart(2, "0");
  const dtStart = `${y}${pad(m)}${pad(d)}`;
  const endDate = new Date(y, m - 1, d + 1);
  const dtEnd = `${endDate.getFullYear()}${pad(endDate.getMonth() + 1)}${pad(endDate.getDate())}`;
  const now = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const desc = params.description.replace(/\n/g, "\\n");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Devektro//Devektro//NL",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${params.uid}`,
    `DTSTAMP:${now}`,
    `DTSTART;VALUE=DATE:${dtStart}`,
    `DTEND;VALUE=DATE:${dtEnd}`,
    `SUMMARY:${params.title}`,
    `DESCRIPTION:${desc}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body: RequestBody = await req.json();
    const { vehicle_id, title, event_date, type, notes } = body;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Fetch vehicle + driver in one query
    const { data: vehicle, error: vError } = await supabase
      .from("vehicles")
      .select("license_plate, brand, model, driver_id")
      .eq("id", vehicle_id)
      .single();

    if (vError || !vehicle?.driver_id) {
      return new Response(JSON.stringify({ sent: false, reason: "no_driver" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: driver, error: dError } = await supabase
      .from("drivers")
      .select("first_name, last_name, email")
      .eq("id", vehicle.driver_id)
      .single();

    if (dError || !driver?.email) {
      return new Response(JSON.stringify({ sent: false, reason: "no_email" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      console.error("RESEND_API_KEY not set");
      return new Response(JSON.stringify({ sent: false, reason: "no_resend_key" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    const formattedDate = new Date(event_date).toLocaleDateString("nl-BE", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const emailHtml = `
      <p>Beste ${driver.first_name} ${driver.last_name},</p>
      <p>Er werd een nieuwe afspraak ingepland voor uw voertuig.</p>
      <table style="border-collapse:collapse;margin-top:12px;">
        <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Voertuig</td><td>${vehicle.brand} ${vehicle.model} (${vehicle.license_plate})</td></tr>
        <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Afspraak</td><td>${title}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Type</td><td style="text-transform:capitalize;">${type}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Datum</td><td>${formattedDate}</td></tr>
        ${notes ? `<tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Notities</td><td>${notes}</td></tr>` : ""}
      </table>
      <p style="margin-top:16px;">De afspraak is toegevoegd als agenda-bijlage.</p>
      <p style="margin-top:8px;">Met vriendelijke groeten,<br/>Devektro</p>
    `;

    // Build ICS
    const description = [
      `Voertuig: ${vehicle.brand} ${vehicle.model} (${vehicle.license_plate})`,
      `Type: ${type}`,
      notes ? `Notities: ${notes}` : null,
    ].filter(Boolean).join("\n");

    const icsContent = buildIcs({
      uid: `${vehicle_id}-${event_date}-${Date.now()}@devektro`,
      title: `${title} — ${vehicle.brand} ${vehicle.model} (${vehicle.license_plate})`,
      date: event_date,
      description,
    });

    const icsBase64 = btoa(unescape(encodeURIComponent(icsContent)));

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: Deno.env.get("EMAIL_FROM") ?? "noreply@pebg.be",
        to: [driver.email],
        subject: `Nieuwe afspraak: ${title} — ${formattedDate}`,
        html: emailHtml,
        attachments: [
          {
            filename: "afspraak.ics",
            content: icsBase64,
            content_type: "text/calendar; charset=utf-8; method=REQUEST",
          },
        ],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Resend error:", err);
      return new Response(JSON.stringify({ sent: false, reason: "resend_error", detail: err }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    return new Response(JSON.stringify({ sent: true, to: driver.email }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ sent: false, reason: "unexpected", detail: String(err) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
