# BrightPath (Static Frontend + Tiny API)

An elegant educational web platform with:

- `public/`: static frontend (HTML/CSS/JS)
- Node.js backend (Express) with SQLite for one-time codes

## How to run

### Install dependencies

You need Node.js + npm installed, then run:

```bash
npm install
```

### Start server

```bash
npm start
```

Open `http://localhost:3000`.

## Edit videos

Put your video files in these folders (unlimited videos per grade):

- `public/assets/videos/grade-1/`
- `public/assets/videos/grade-2/`
- `public/assets/videos/grade-3/`

The platform uses the **filename (without extension)** as the lesson title.

After adding or removing videos, regenerate the manifest with PowerShell:

```powershell
.\tools\generate-manifests.ps1
```

If Windows blocks scripts, use:

```bat
generate-manifests.bat
```

Then refresh `Videos` and the new lessons will appear.

### Optional thumbnails (posters)

If you add an image with the same name as the video, it will be used as the thumbnail:

- `My Lesson.mp4`
- `My Lesson.jpg` (or `.png`, `.webp`)

## One-time codes (global)

- Endpoint: `POST /api/validate-code` with JSON `{ "code": "BP1-001-ABCDE" }`
- The server checks SQLite:
  - If code is valid and unused → **redeems** it and returns grade info
  - If already used → rejects it

### Important: teacher secret

Codes are generated from a secret:

- Backend: `TEACHER_SECRET` in environment (or default in `src/db.mjs`)

- If you change `TEACHER_SECRET`, you MUST reprint new codes.
- Keep the secret private.

### Security note

The frontend is static, but code redemption is enforced server-side (SQLite). This is still not a full user-account system, but it does guarantee **one-time use globally**.

