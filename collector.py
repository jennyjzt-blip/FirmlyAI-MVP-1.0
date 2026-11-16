"""Conservative public-page monitor: suggestions require human verification."""
import re, sqlite3, urllib.request, urllib.parse, html
from html.parser import HTMLParser
from datetime import datetime, timezone
from pathlib import Path

DB = Path(__file__).resolve().parent / "firmly.db"
HEADERS = {"User-Agent": "FirmlyAI-ResearchPrototype/0.2 (public recruiting page monitor)"}
KEYWORDS = re.compile(r"summer associate|summer program|summer clerk|application deadline|applications open|apply now|recruiting", re.I)
DATE = re.compile(r"\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2}(?:,\s*\d{4})?|\b\d{1,2}/\d{1,2}/\d{2,4}\b", re.I)

class Text(HTMLParser):
    def __init__(self):
        super().__init__(); self.parts=[]; self.skip=0
    def handle_starttag(self, tag, attrs):
        if tag in ("script","style","noscript"): self.skip+=1
    def handle_endtag(self, tag):
        if tag in ("script","style","noscript") and self.skip:self.skip-=1
        if tag in ("p","li","h1","h2","h3","div","br"):self.parts.append("\n")
    def handle_data(self, data):
        if not self.skip:self.parts.append(data)

def ensure_schema(conn):
    conn.executescript("""
    CREATE TABLE IF NOT EXISTS recruiting_sources(
      id INTEGER PRIMARY KEY, firm_id INTEGER NOT NULL,
      url TEXT NOT NULL UNIQUE, active INTEGER NOT NULL DEFAULT 1,
      last_checked TEXT, last_error TEXT);
    CREATE TABLE IF NOT EXISTS recruiting_findings(
      id INTEGER PRIMARY KEY, source_id INTEGER NOT NULL,
      snippet TEXT NOT NULL, observed_at TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'needs_review',
      UNIQUE(source_id,snippet));
    """)

def check_sources():
    with sqlite3.connect(DB) as conn:
        conn.row_factory=sqlite3.Row; ensure_schema(conn)
        sources=conn.execute("SELECT * FROM recruiting_sources WHERE active=1").fetchall()
        for src in sources:
            now=datetime.now(timezone.utc).isoformat(timespec="seconds")
            try:
                u=urllib.parse.urlparse(src["url"])
                if u.scheme!="https" or not u.hostname:
                    raise ValueError("Only HTTPS sources are supported")
                req=urllib.request.Request(src["url"],headers=HEADERS)
                with urllib.request.urlopen(req,timeout=12) as response:
                    final=urllib.parse.urlparse(response.geturl())
                    if final.scheme!="https":raise ValueError("Non-HTTPS redirect")
                    if "html" not in response.headers.get("Content-Type","").lower():
                        raise ValueError("Not an HTML page")
                    raw=response.read(800_000)
                parser=Text();parser.feed(raw.decode("utf-8",errors="replace"))
                lines=[" ".join(x.split()) for x in "".join(parser.parts).splitlines()]
                findings=[]
                for idx,line in enumerate(lines):
                    if KEYWORDS.search(line):
                        excerpt=" ".join(lines[max(0,idx-1):idx+3]).strip()[:600]
                        if len(excerpt)>=20 and excerpt not in findings:findings.append(excerpt)
                for snippet in findings[:25]:
                    conn.execute("INSERT OR IGNORE INTO recruiting_findings(source_id,snippet,observed_at) VALUES(?,?,?)",(src["id"],snippet,now))
                conn.execute("UPDATE recruiting_sources SET last_checked=?,last_error=NULL WHERE id=?",(now,src["id"]))
            except Exception as exc:
                conn.execute("UPDATE recruiting_sources SET last_checked=?,last_error=? WHERE id=?",(now,str(exc)[:300],src["id"]))
            conn.commit()
    return len(sources)

if __name__=="__main__":
    print(f"Checked {check_sources()} configured source(s). Open /discover/monitor to review findings.")
