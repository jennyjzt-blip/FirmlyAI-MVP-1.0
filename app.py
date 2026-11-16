import os, sqlite3, json, urllib.request
from dotenv import load_dotenv
from pathlib import Path
load_dotenv(Path(__file__).resolve().parent / ".env")
from flask import Flask, render_template_string, request, redirect, url_for, flash, session
from werkzeug.utils import secure_filename

BASE=Path(__file__).resolve().parent
app=Flask(__name__)
app.secret_key=os.environ.get("SECRET_KEY","local-demo-change-before-deployment")
DB=BASE/"firmly.db"
UPLOADS=BASE/"uploads"
UPLOADS.mkdir(exist_ok=True)
FIRMS=[
("Kirkland & Ellis","https://www.kirkland.com","Private equity, litigation"),
("Latham & Watkins","https://www.lw.com","Corporate, finance, litigation"),
("Skadden","https://www.skadden.com","M&A, litigation"),
("Gibson Dunn","https://www.gibsondunn.com","Litigation, corporate"),
("Sidley Austin","https://www.sidley.com","Corporate, regulatory"),
("Davis Polk","https://www.davispolk.com","Capital markets, M&A"),
("Sullivan & Cromwell","https://www.sullcrom.com","Finance, corporate"),
("Paul Weiss","https://www.paulweiss.com","Litigation, private equity"),
("Simpson Thacher","https://www.stblaw.com","Private equity, M&A"),
("Cravath","https://www.cravath.com","Corporate, litigation"),
]
def connect():
 c=sqlite3.connect(DB);c.row_factory=sqlite3.Row;return c
def init():
 with connect() as c:
  c.executescript("""CREATE TABLE IF NOT EXISTS firms(id INTEGER PRIMARY KEY,name TEXT UNIQUE,website TEXT,practice TEXT);
  CREATE TABLE IF NOT EXISTS opportunities(id INTEGER PRIMARY KEY,firm_id INTEGER,title TEXT,office TEXT,open_date TEXT,deadline TEXT,apply_url TEXT,source_url TEXT,verified_at TEXT,notes TEXT);
  CREATE TABLE IF NOT EXISTS profile(id INTEGER PRIMARY KEY CHECK(id=1),name TEXT,school TEXT,grad TEXT,gpa TEXT,practice TEXT,location TEXT,experience TEXT);
  CREATE TABLE IF NOT EXISTS applications(id INTEGER PRIMARY KEY,opportunity_id INTEGER,firm_name TEXT,position TEXT,office TEXT,mode TEXT,status TEXT,notes TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
  CREATE TABLE IF NOT EXISTS letters(id INTEGER PRIMARY KEY,firm TEXT,office TEXT,motivation TEXT,letter TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP);""")
  c.executemany("INSERT OR IGNORE INTO firms(name,website,practice) VALUES(?,?,?)",FIRMS)
init()
STYLE="""<style>
:root{font-family:Inter,system-ui,Arial;background:#f5f7fb;color:#17223a}*{box-sizing:border-box}body{margin:0}header{background:#111f3b;color:white;padding:22px 5%;display:flex;justify-content:space-between;align-items:center}header strong{font-size:25px;letter-spacing:-1px}nav a{color:#dce7fa;margin-left:22px;text-decoration:none}nav a:hover{color:white}main{max-width:1150px;margin:38px auto;padding:0 20px}.hero{background:linear-gradient(120deg,#162c55,#385c8e);color:white;padding:38px;border-radius:18px;margin-bottom:22px}.hero h1{font-size:36px;margin:0 0 8px}.hero p{color:#e0e9f6}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(235px,1fr));gap:16px}.card{background:white;border:1px solid #e2e8f0;border-radius:14px;padding:22px;margin-bottom:16px;box-shadow:0 3px 14px #12234b0a}.card h3{margin-top:0}.muted{color:#64748b}.badge{display:inline-block;background:#e7f0ff;color:#204d86;padding:5px 10px;border-radius:30px;font-size:12px}button,.btn{border:0;background:#244e88;color:white;padding:11px 17px;border-radius:8px;cursor:pointer;text-decoration:none;display:inline-block}button.secondary,.btn.secondary{background:#e7edf5;color:#19345d}input,textarea,select{width:100%;padding:11px;margin:6px 0 13px;border:1px solid #cbd5e1;border-radius:8px;background:white}label{font-weight:600;font-size:13px}textarea{min-height:95px}table{width:100%;border-collapse:collapse;background:white}th,td{text-align:left;padding:13px;border-bottom:1px solid #e6ebf1;vertical-align:top}th{color:#52657e;font-size:13px}a{color:#2456a0}.notice{padding:12px;background:#fff4d8;border-radius:8px;margin:15px 0;color:#664d13}.success{padding:12px;background:#e3f6e9;border-radius:8px;margin:15px 0}.two{display:grid;grid-template-columns:1fr 1fr;gap:20px}@media(max-width:700px){.two{grid-template-columns:1fr}header{display:block}nav a{display:inline-block;margin:12px 12px 0 0}}pre{white-space:pre-wrap;line-height:1.65;background:#f6f8fc;padding:20px;border-radius:10px}</style>"""
BASE_HTML="""<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Firmly AI</title>"""+STYLE+"""</head><body><header><strong>⚖ Firmly<span style="color:#9dbdf0">AI</span></strong><nav><a href="/">Dashboard</a><a href="/discover">Discover</a><a href="/discover/monitor">Monitor</a><a href="/prepare">Prepare</a><a href="/prepare/upload">Upload Resume</a><a href="/apply">Apply</a><a href="/profile">My Profile</a></nav></header><main>{% with messages=get_flashed_messages() %}{% for m in messages %}<div class="success">{{m}}</div>{% endfor %}{% endwith %}{{ content|safe }}</main></body></html>"""
def page(content,**kwargs):
 from flask import render_template_string
 body=render_template_string(content,**kwargs)
 return render_template_string(BASE_HTML,content=body)
@app.route("/")
def home():
 with connect() as c:
  firms=c.execute("SELECT count(*) n FROM firms").fetchone()["n"]
  opps=c.execute("SELECT count(*) n FROM opportunities").fetchone()["n"]
  apps=c.execute("SELECT count(*) n FROM applications").fetchone()["n"]
 return page("""<section class="hero"><h1>Applications, with confidence.</h1><p>Discover BigLaw opportunities, prepare tailored materials, and manage every application in one place.</p><a class="btn" style="background:white;color:#19345d" href="/discover">Explore opportunities →</a></section><div class="grid"><div class="card"><span class="badge">DISCOVER</span><h2>{{firms}} firms</h2><p class="muted">{{opps}} opportunity records · Dates require verification</p><a href="/discover">Explore →</a></div><div class="card"><span class="badge">PREPARE</span><h2>Personalize</h2><p class="muted">Cover letter drafting, resume checks and student context.</p><a href="/prepare">Create materials →</a></div><div class="card"><span class="badge">APPLY</span><h2>{{apps}} tracked</h2><p class="muted">Manual workflow and automation-readiness dashboard.</p><a href="/apply">Track applications →</a></div></div><div class="notice">Local prototype: no live recruiting data, user authentication, automatic submission, or verified firm-specific facts. Do not upload sensitive real student data.</div>""",firms=firms,opps=opps,apps=apps)
@app.route("/profile",methods=["GET","POST"])
def profile():
 with connect() as c:
  if request.method=="POST":
   v=[request.form.get(k,"").strip() for k in ("name","school","grad","gpa","practice","location","experience")]
   c.execute("INSERT OR REPLACE INTO profile(id,name,school,grad,gpa,practice,location,experience) VALUES(1,?,?,?,?,?,?,?)",v)
   flash("Profile saved on this computer.");return redirect("/profile")
  p=c.execute("SELECT * FROM profile WHERE id=1").fetchone()
 return page("""<h1>Student profile</h1><p class="muted">Enter once, reuse for matching and drafting. Stored locally on this Mac.</p><form class="card" method="post"><div class="two">{% for k,label in fields %}<div><label>{{label}}</label><input name="{{k}}" value="{{p[k] if p else ''}}"></div>{% endfor %}</div><label>Experience and accomplishments (only verified facts)</label><textarea name="experience">{{p['experience'] if p else ''}}</textarea><button>Save profile</button></form>""",p=p,fields=[("name","Full name"),("school","Law school"),("grad","Graduation year"),("gpa","GPA (optional)"),("practice","Preferred practice areas"),("location","Preferred offices")])
@app.route("/discover",methods=["GET","POST"])
def discover():
 with connect() as c:
  if request.method=="POST":
   vals=[request.form.get(k,"").strip() for k in ("firm_id","title","office","open_date","deadline","apply_url","source_url","notes")]
   if not vals[0] or not vals[1]:flash("Select a firm and enter a position.");return redirect("/discover")
   c.execute("INSERT INTO opportunities(firm_id,title,office,open_date,deadline,apply_url,source_url,notes) VALUES(?,?,?,?,?,?,?,?)",vals)
   flash("Opportunity saved. Dates remain unverified until independently checked.");return redirect("/discover")
  firms=c.execute("SELECT * FROM firms ORDER BY name").fetchall()
  q=request.args.get("q","").strip()
  rows=c.execute("""SELECT o.*,f.name firm,f.practice,f.website FROM opportunities o JOIN firms f ON f.id=o.firm_id WHERE f.name LIKE ? OR o.title LIKE ? OR o.office LIKE ? ORDER BY o.deadline IS NULL,o.deadline""",tuple(["%"+q+"%"]*3)).fetchall()
 return page("""<h1>Discover opportunities</h1><p class="muted">Track BigLaw summer associate opportunities. No opening dates or deadlines are assumed.</p><div class="card"><form method="get"><label>Search opportunities</label><input name="q" value="{{q}}" placeholder="Firm, office, position"><button>Search</button></form></div><div class="card"><h3>Opportunity tracker</h3>{% if rows %}<div style="overflow-x:auto"><table><tr><th>Firm / position</th><th>Office</th><th>Opens</th><th>Deadline</th><th>Source</th><th></th></tr>{% for r in rows %}<tr><td><b>{{r.firm}}</b><br>{{r.title}}</td><td>{{r.office or 'Unknown'}}</td><td>{{r.open_date or 'Not announced'}}</td><td>{{r.deadline or 'Not announced'}}</td><td>{% if r.source_url %}<a href="{{r.source_url}}" target="_blank" rel="noopener">Source ↗</a>{% else %}Unverified{% endif %}</td><td><a href="/apply?opportunity={{r.id}}">Track →</a></td></tr>{% endfor %}</table></div>{% else %}<p class="muted">No opportunities entered yet. Add the first verified recruiting listing below.</p>{% endif %}</div><div class="two"><div class="card"><h3>Firm directory</h3>{% for f in firms %}<p><b>{{f.name}}</b><br><span class="muted">{{f.practice}} · <a href="{{f.website}}" target="_blank" rel="noopener">Official website ↗</a></span></p>{% endfor %}<small class="muted">Practice summaries are general starting points, not verified recruiting claims. News and alumni counts require sourced integrations.</small></div><div class="card"><h3>Add opportunity</h3><form method="post"><label>Firm</label><select name="firm_id">{% for f in firms %}<option value="{{f.id}}">{{f.name}}</option>{% endfor %}</select><label>Position</label><input name="title" placeholder="2L Summer Associate" required><label>Office</label><input name="office" placeholder="New York"><label>Opening date (only if confirmed)</label><input name="open_date" type="date"><label>Deadline (only if confirmed)</label><input name="deadline" type="date"><label>Official application URL</label><input name="apply_url" type="url"><label>Source URL</label><input name="source_url" type="url"><label>Eligibility / source notes</label><textarea name="notes"></textarea><button>Add opportunity</button></form></div></div>""",firms=firms,rows=rows,q=q)
def ai_text(prompt):
 key=os.environ.get("OPENAI_API_KEY")
 if not key:return None
 payload=json.dumps({"model":os.environ.get("OPENAI_MODEL","gpt-4.1-mini"),"messages":[{"role":"system","content":"You are a careful US law student career writing assistant. Never invent personal facts, firm facts, conversations or credentials. Flag uncertainty and ask for missing details. Do not make legal advice claims."},{"role":"user","content":prompt}],"temperature":0.4}).encode()
 req=urllib.request.Request("https://api.openai.com/v1/chat/completions",data=payload,headers={"Authorization":"Bearer "+key,"Content-Type":"application/json"})
 with urllib.request.urlopen(req,timeout=35) as res:
  return json.load(res)["choices"][0]["message"]["content"]
@app.route("/prepare",methods=["GET","POST"])
def prepare():
 result=None;kind=None
 with connect() as c:
  p=c.execute("SELECT * FROM profile WHERE id=1").fetchone()
  if request.method=="POST":
   kind=request.form.get("kind")
   if kind=="resume":
    resume=request.form.get("resume","")[:15000]
    if not resume.strip():flash("Paste resume text first.");return redirect("/prepare")
    prompt="Review this law student resume. Only flag significant errors, inconsistencies, eligibility/location mismatches, or unsupported claims. Avoid cosmetic nitpicks. Clearly separate confirmed issues from questions.\nProfile: "+str(dict(p) if p else {})+"\nResume:\n"+resume
   else:
    firm=request.form.get("firm","").strip();office=request.form.get("office","").strip();motivation=request.form.get("motivation","").strip()
    if not firm or not motivation:flash("Enter a firm and your genuine connection or motivation.");return redirect("/prepare")
    prompt="Draft a concise US BigLaw summer associate cover letter. Use ONLY supplied facts, mark missing details in [brackets], avoid unsupported firm claims, and include the student's own reasons.\nStudent profile: "+str(dict(p) if p else {})+"\nFirm: "+firm+"\nOffice: "+office+"\nPersonal connections and motivation: "+motivation
   try:result=ai_text(prompt)
   except Exception as e:result="AI request failed. Check your API key and billing. Technical detail: "+str(e)[:250]
   if result is None:
    result=("AI is not configured yet. To enable drafting, set OPENAI_API_KEY in your Mac terminal. You can still use this page and save your profile.\n\n"+("Important checks: verify office preference, eligibility, graduation year, GPA consistency, dates, and factual claims." if kind=="resume" else "Cover letter outline:\n1. Why this firm and office\n2. Relevant verified experience\n3. Your personal connection: "+motivation+"\n4. Closing and interest in interviewing"))
   if kind=="letter":
    c.execute("INSERT INTO letters(firm,office,motivation,letter) VALUES(?,?,?,?)",(firm,office,motivation,result))
  letters=c.execute("SELECT * FROM letters ORDER BY id DESC LIMIT 5").fetchall()
 return page("""<h1>Prepare materials</h1><p class="muted">Substantive resume checks and student-led, firm-specific cover letters.</p><div class="notice">AI drafting is optional and requires an API key and may incur charges. Do not enter confidential personal information in this local prototype.</div><div class="two"><div class="card"><h3>Resume assistant</h3><p class="muted">Flags major issues only—not every stylistic preference.</p><form method="post"><input type="hidden" name="kind" value="resume"><label>Paste resume text</label><textarea name="resume" style="min-height:250px" placeholder="Paste resume text here..."></textarea><button>Check major issues</button></form></div><div class="card"><h3>Cover letter studio</h3><form method="post"><input type="hidden" name="kind" value="letter"><label>Target firm</label><input name="firm" required placeholder="Firm name"><label>Office</label><input name="office" placeholder="New York"><label>Your real connection, conversation or motivation</label><textarea name="motivation" required placeholder="I spoke with...; I attended...; I'm interested in..."></textarea><button>Generate draft</button></form></div></div>{% if result %}<div class="card"><h3>{{'Resume review' if kind=='resume' else 'Cover letter draft'}}</h3><pre>{{result}}</pre><p class="muted">Review every fact and edit before use.</p></div>{% endif %}<div class="card"><h3>Recent firm-specific drafts</h3>{% for l in letters %}<details><summary>{{l.firm}} — {{l.office or 'Office unspecified'}} ({{l.created_at}})</summary><pre>{{l.letter}}</pre></details>{% else %}<p class="muted">No drafts yet.</p>{% endfor %}</div>""",result=result,kind=kind,letters=letters)
@app.route("/apply",methods=["GET","POST"])
def apply():
 with connect() as c:
  if request.method=="POST":
   opportunity_id=request.form.get("opportunity_id") or None
   firm=request.form.get("firm","").strip();position=request.form.get("position","").strip()
   mode=request.form.get("mode","manual")
   if mode not in ("manual","automatic"):mode="manual"
   if not firm or not position:flash("Firm and position are required.");return redirect("/apply")
   c.execute("INSERT INTO applications(opportunity_id,firm_name,position,office,mode,status,notes) VALUES(?,?,?,?,?,?,?)",(opportunity_id,firm,position,request.form.get("office",""),mode,"Draft — not submitted",request.form.get("notes","")))
   flash("Application tracking record created. No form was submitted.");return redirect("/apply")
  oppid=request.args.get("opportunity")
  opp=c.execute("SELECT o.*,f.name firm FROM opportunities o JOIN firms f ON f.id=o.firm_id WHERE o.id=?",(oppid,)).fetchone() if oppid else None
  apps=c.execute("SELECT * FROM applications ORDER BY id DESC").fetchall()
 return page("""<h1>Apply & track</h1><div class="two"><div class="card"><span class="badge">MODE 1</span><h3>AI-assisted manual</h3><p>Open the official portal, review your materials, complete the form, and submit personally.</p><p class="muted">Working now: application checklist and tracking. Browser extension not yet implemented.</p></div><div class="card"><span class="badge">MODE 2</span><h3>Automated application</h3><p>Planned: approved portal adapters, explicit authorization, verified form answers, human escalation and confirmation capture.</p><div class="notice">Automatic form filling and submission are NOT implemented in this starter. Selecting this mode only creates a tracking record.</div></div></div><div class="card"><h3>Track an application</h3><form method="post"><input type="hidden" name="opportunity_id" value="{{opp.id if opp else ''}}"><div class="two"><div><label>Firm</label><input name="firm" required value="{{opp.firm if opp else ''}}"></div><div><label>Position</label><input name="position" required value="{{opp.title if opp else ''}}"></div></div><label>Office</label><input name="office" value="{{opp.office if opp else ''}}"><label>Mode</label><select name="mode"><option value="manual">Manual, AI-assisted (tracking)</option><option value="automatic">Automated (future feature, tracking only)</option></select><label>Notes / checklist</label><textarea name="notes" placeholder="Resume approved, cover letter reviewed, portal login ready..."></textarea>{% if opp and opp.apply_url %}<p><a href="{{opp.apply_url}}" target="_blank" rel="noopener">Open official application ↗</a></p>{% endif %}<button>Create tracking record</button></form></div><div class="card"><h3>My applications</h3><table><tr><th>Firm</th><th>Position</th><th>Mode</th><th>Status</th><th></th></tr>{% for a in apps %}<tr><td>{{a.firm_name}}</td><td>{{a.position}}<br><small>{{a.office}}</small></td><td>{{a.mode}}</td><td>{{a.status}}</td><td><form method="post" action="/application/{{a.id}}/update"><select name="status"><option>Draft — not submitted</option><option>Preparing</option><option>Submitted — self-reported</option><option>Interview</option><option>Closed</option></select><button class="secondary">Update</button></form></td></tr>{% else %}<tr><td colspan="5">No tracked applications yet.</td></tr>{% endfor %}</table></div>""",opp=opp,apps=apps)
@app.route("/application/<int:aid>/update",methods=["POST"])
def update(aid):
 allowed={"Draft — not submitted","Preparing","Submitted — self-reported","Interview","Closed"}
 status=request.form.get("status")
 if status in allowed:
  with connect() as c:c.execute("UPDATE applications SET status=? WHERE id=?",(status,aid))
 return redirect("/apply")

# Discover monitoring admin: local prototype only; protect before deployment.
from collector import ensure_schema, check_sources
@app.route("/discover/monitor",methods=["GET","POST"])
def discover_monitor():
 with connect() as c:
  ensure_schema(c)
  if request.method=="POST":
   action=request.form.get("action")
   if action=="add":
    try:
     from urllib.parse import urlparse
     url=request.form.get("url","").strip()
     host=urlparse(url)
     firm_id=int(request.form.get("firm_id","0"))
     valid=c.execute("SELECT id FROM firms WHERE id=?",(firm_id,)).fetchone()
     if host.scheme!="https" or not host.hostname or not valid:raise ValueError("Select a firm and a valid HTTPS URL")
     c.execute("INSERT OR IGNORE INTO recruiting_sources(firm_id,url) VALUES(?,?)",(firm_id,url))
     flash("Recruiting source saved.")
    except Exception as exc:flash(f"Could not add source: {exc}")
   elif action=="check":
    count=check_sources()
    flash(f"Checked {count} source(s). Review findings before adding opportunities.")
   elif action=="dismiss":
    c.execute("UPDATE recruiting_findings SET status='dismissed' WHERE id=?",(request.form.get("finding_id"),))
   return redirect("/discover/monitor")
  firms=c.execute("SELECT id,name FROM firms ORDER BY name").fetchall()
  sources=c.execute("SELECT s.*,f.name firm FROM recruiting_sources s JOIN firms f ON f.id=s.firm_id ORDER BY f.name").fetchall()
  findings=c.execute("""SELECT x.*,s.url,f.name firm FROM recruiting_findings x
  JOIN recruiting_sources s ON s.id=x.source_id JOIN firms f ON f.id=s.firm_id
  WHERE x.status='needs_review' ORDER BY x.observed_at DESC LIMIT 100""").fetchall()
 return page("""<h1>Discover · Recruiting Monitor</h1><div class="notice">Local research prototype. Findings are unverified snippets, NOT confirmed openings or deadlines. Review the official page before adding an opportunity. Only monitor public pages where automated access is permitted.</div>
 <div class="card"><h3>Add an official recruiting page</h3><form method="post"><input type="hidden" name="action" value="add"><label>Firm</label><select name="firm_id">{% for f in firms %}<option value="{{f.id}}">{{f.name}}</option>{% endfor %}</select><label>Official HTTPS recruiting page URL</label><input name="url" type="url" required placeholder="https://..."><button>Add source</button></form></div>
 <div class="card"><h3>Monitored pages</h3><form method="post"><input type="hidden" name="action" value="check"><button>Check pages now</button></form><table><tr><th>Firm</th><th>Source</th><th>Last checked</th><th>Error</th></tr>{% for s in sources %}<tr><td>{{s.firm}}</td><td><a href="{{s.url}}" target="_blank" rel="noopener noreferrer">Open source</a></td><td>{{s.last_checked or 'Never'}}</td><td>{{s.last_error or '—'}}</td></tr>{% else %}<tr><td colspan="4">Add your first recruiting page above.</td></tr>{% endfor %}</table></div>
 <div class="card"><h3>Potential recruiting mentions — review required</h3>{% for x in findings %}<div class="card"><b>{{x.firm}}</b><p>{{x.snippet}}</p><a href="{{x.url}}" target="_blank" rel="noopener noreferrer">Verify on official source ↗</a> · <a href="/discover">Manually add verified opportunity</a><form method="post"><input type="hidden" name="action" value="dismiss"><input type="hidden" name="finding_id" value="{{x.id}}"><button class="secondary">Dismiss</button></form></div>{% else %}<p class="muted">No pending findings.</p>{% endfor %}</div>""",firms=firms,sources=sources,findings=findings)


@app.route("/prepare/upload", methods=["GET", "POST"])
def resume_upload():
    """Local-only PDF/DOCX upload and optional AI major-issue review."""
    from io import BytesIO
    from pypdf import PdfReader
    from docx import Document
    result = None
    extracted = None
    if request.method == "POST":
        f = request.files.get("resume")
        if not f or not f.filename:
            flash("Choose a PDF or DOCX resume first.")
            return redirect("/prepare/upload")
        extension = Path(f.filename).suffix.lower()
        if extension not in {".pdf", ".docx"}:
            flash("Only PDF and DOCX files are supported.")
            return redirect("/prepare/upload")
        raw = f.read(5 * 1024 * 1024 + 1)
        if len(raw) > 5 * 1024 * 1024:
            flash("File must be smaller than 5 MB.")
            return redirect("/prepare/upload")
        try:
            if extension == ".pdf":
                extracted = "\\n".join(page.extract_text() or "" for page in PdfReader(BytesIO(raw)).pages)
            else:
                extracted = "\\n".join(p.text for p in Document(BytesIO(raw)).paragraphs)
            extracted = extracted[:16000]
            if not extracted.strip():
                raise ValueError("No selectable text found. Scanned PDFs need text extraction.")
            if request.form.get("analyze") == "yes":
                with connect() as c:
                    profile = c.execute("SELECT * FROM profile WHERE id=1").fetchone()
                prompt = ("Review this US law student resume. Flag only consequential issues: "
                          "factual contradictions, missing eligibility, location or graduation-year "
                          "mismatch. Do not invent facts. Distinguish verified issues from questions.\\n"
                          "Profile: " + str(dict(profile) if profile else {}) + "\\nResume:\\n" + extracted)
                result = ai_text(prompt)
                if result is None:
                    result = "AI not configured. Add OPENAI_API_KEY to .env, restart Firmly AI, and try again."
        except Exception as exc:
            flash("Could not read resume: " + str(exc)[:160])
            return redirect("/prepare/upload")
    return page("""<h1>Resume upload & review</h1>
    <div class="notice">Local prototype. Files are processed in memory; extracted text may be sent to OpenAI if you select AI review. Do not use sensitive student documents until authentication and privacy controls are added.</div>
    <div class="card"><form method="post" enctype="multipart/form-data">
    <label>PDF or DOCX resume (maximum 5 MB)</label><input type="file" name="resume" accept=".pdf,.docx" required>
    <label>AI review</label><select name="analyze"><option value="no">Extract text only (free)</option><option value="yes">Check major issues using OpenAI (API cost)</option></select>
    <button>Process resume</button></form></div>
    {% if extracted %}<div class="card"><h3>Extracted resume text</h3><pre>{{extracted}}</pre></div>{% endif %}
    {% if result %}<div class="card"><h3>AI feedback</h3><pre>{{result}}</pre></div>{% endif %}
    """, extracted=extracted, result=result)

@app.route("/health")
def health():
    return {"status":"ok", "ai_configured":bool(os.environ.get("OPENAI_API_KEY"))}

if __name__=="__main__":
 print("Open http://127.0.0.1:5000 in your browser")
 app.run(host="127.0.0.1",port=5000,debug=False)
