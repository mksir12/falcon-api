const axios = require("axios"); const { createClient } = require("@supabase/supabase-js");

const supabase = createClient("https://rdacdjpcbcgkxsqwofnz.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkYWNkanBjYmNna3hzcXdvZm56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0NDg3MzcsImV4cCI6MjA2MjAyNDczN30.IAvUW-LWkj78QcO-ts_JJp72TN0Uy_kJMc_3CreC8iY");

// Generate ID session random 
function randomSessionID() { return "@" + Math.random().toString(36).substring(2, 8).toUpperCase(); }

// Buat session baru dengan role custom 
async function createNewSession(role, model = "deepseek") { const sessionId = randomSessionID(); const messages = [ { role: "system", content: role || "Kamu adalah AI ramah yang siap membantu." } ]; await supabase.from("ai_sessions").insert({ user_id: sessionId, model, messages }); return sessionId; }

module.exports = function (app) { // Buat session baru 
app.get("/ai/createchat", async (req, res) => { const { role } = req.query; try { const sessionId = await createNewSession(role); res.json({ status: true, message: "Session berhasil dibuat", session_id: sessionId, role: role || "default" }); } catch (e) { res.status(500).json({ status: false, message: e.message }); } });

// Kirim chat berdasarkan session 
app.get("/ai/chat", async (req, res) => { const { q, session } = req.query;

if (!q || !session) {
  return res.status(400).json({ status: false, message: "Parameter 'q' dan 'session' wajib diisi." });
}

const endpoint = "https://ai.clauodflare.workers.dev/chat";
const model_id = "@cf/deepseek-ai/deepseek-r1-distill-qwen-32b";

// Ambil atau buat session
let { data: sessionData } = await supabase
  .from("ai_sessions")
  .select("*")
  .eq("user_id", session)
  .single();

let messages;

if (!sessionData) {
  messages = [
    {
      role: "system",
      content: "Kamu adalah AI ramah yang siap membantu."
    }
  ];
  await supabase.from("ai_sessions").insert({
    user_id: session,
    model: "deepseek",
    messages
  });
} else {
  messages = sessionData.messages;
}

messages.push({ role: "user", content: q });

try {
  const { data } = await axios.post(endpoint, {
    model: model_id,
    messages
  });

  const reply = data?.data?.response?.split("</think>").pop().trim();
  messages.push({ role: "assistant", content: reply });

  await supabase.from("ai_sessions")
    .update({ messages, updated_at: new Date() })
    .eq("user_id", session);

  res.json({
    status: true,
    session,
    response: reply
  });
} catch (err) {
  res.status(500).json({ status: false, message: err.message });
}

}); };

    
