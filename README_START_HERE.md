# Firmly AI — Integrated local development build (Mac)

This build preserves the starter's Discover, Prepare, Apply and Monitor pages and adds
PDF/DOCX resume text extraction and an optional OpenAI major-issue review.

## Install (beginner steps)
1. Keep your existing FirmlyAI-starter folder. Do NOT delete it.
2. Stop the old Terminal server with Control+C.
3. Unzip this package into a NEW folder, `FirmlyAI-MVP-1.0`.
4. To retain existing records, COPY `firmly.db` from the OLD folder into the NEW folder.
   Do not overwrite the old database; keep the old folder as a backup.
5. Open Terminal. Type `cd ` (including a space), drag the NEW folder into Terminal,
   and press Return.
6. Run `bash START_MAC.command`.
7. Open http://127.0.0.1:5000 and visit Prepare > Upload Resume.

## Optional: enable OpenAI
1. In the NEW folder, duplicate `.env.example` and rename the copy `.env`.
   Files beginning with a dot are hidden in Finder; press Command+Shift+Period to show them.
2. Open `.env` in a plain-text editor.
3. Put your OpenAI API key after `OPENAI_API_KEY=` (no quotation marks).
4. Set `SECRET_KEY=` to a long random string for local use.
5. Save. Restart the server using Control+C and `bash START_MAC.command`.
6. Visit http://127.0.0.1:5000/health and check `ai_configured: true`.
Do not share `.env` or your API key, and do not upload it to GitHub.

## What is implemented
- Local SQLite student profile and application tracking (single-user prototype)
- Discover directory and manual opportunities
- Recruiting monitor for configured publicly accessible URLs
- AI cover-letter drafting via OpenAI when configured
- Paste-based resume review
- NEW PDF/DOCX resume text extraction and optional AI review

## Not yet implemented
- Real multi-user authentication or secure student data isolation
- Full Am Law 100 verified recruiting feed, daily scheduled monitoring, automatic verification
- Automatic external application form filling/submission
- Complete document editing/export, robust background job management
- Production-ready privacy/security controls

Do not publish this local prototype for public student use. The monitor should only
access permitted public pages. Source findings require verification.
