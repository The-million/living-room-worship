// Living-Room Worship — Admin API
// Proxies Supabase queries so the service_role key stays server-side.

const SUPABASE_URL = "https://kauodthouehzwjljzfdq.supabase.co";
const SERVICE_KEY = process.env.VERCEL_SERVICE_KEY;
const ADMIN_CODE = process.env.VERCEL_ADMIN_CODE || "Worship@2026##";

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { password, action, id } = req.body || {};

  // Verify admin password
  if (password !== ADMIN_CODE) {
    return res.status(401).json({ error: "Invalid admin code" });
  }

  if (!SERVICE_KEY) {
    return res.status(500).json({ error: "Server misconfigured: missing service key" });
  }

  try {
    switch (action) {
      case "list":
        const listResp = await fetch(
          `${SUPABASE_URL}/rest/v1/registrations?select=*&order=created_at.desc`,
          {
            headers: {
              apikey: SERVICE_KEY,
              Authorization: `Bearer ${SERVICE_KEY}`,
              Accept: "application/json",
            },
          }
        );
        const data = await listResp.json();
        return res.status(200).json(data);

      case "delete":
        if (!id) return res.status(400).json({ error: "Missing id" });
        await fetch(`${SUPABASE_URL}/rest/v1/registrations?id=eq.${id}`, {
          method: "DELETE",
          headers: {
            apikey: SERVICE_KEY,
            Authorization: `Bearer ${SERVICE_KEY}`,
          },
        });
        return res.status(200).json({ ok: true });

      case "clear":
        // Fetch all, delete each
        const allResp = await fetch(
          `${SUPABASE_URL}/rest/v1/registrations?select=id`,
          {
            headers: {
              apikey: SERVICE_KEY,
              Authorization: `Bearer ${SERVICE_KEY}`,
              Accept: "application/json",
            },
          }
        );
        const all = await allResp.json();
        for (const row of all) {
          await fetch(`${SUPABASE_URL}/rest/v1/registrations?id=eq.${row.id}`, {
            method: "DELETE",
            headers: {
              apikey: SERVICE_KEY,
              Authorization: `Bearer ${SERVICE_KEY}`,
            },
          });
        }
        return res.status(200).json({ ok: true, deleted: all.length });

      default:
        return res.status(400).json({ error: "Unknown action: " + action });
    }
  } catch (err) {
    console.error("Admin API error:", err);
    return res.status(500).json({ error: err.message });
  }
}
