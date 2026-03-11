import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { initDb, validateAndRedeemCode } from "./src/db.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

await initDb();

app.use(express.json({ limit: "64kb" }));

// Static frontend (required: inside /public)
app.use(express.static(path.join(__dirname, "public")));

app.post("/api/validate-code", async (req, res) => {
  const code = typeof req.body?.code === "string" ? req.body.code : "";
  try {
    const result = await validateAndRedeemCode(code);
    if (!result.ok) return res.status(result.status).json(result);
    return res.json(result);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, status: 500, error: "Server error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT} or on Render PORT`);
});

