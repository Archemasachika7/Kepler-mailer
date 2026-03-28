import { useState, useRef } from "react";

const DEFAULT_SUBJECT = "Learn Web Dev, AI/ML, Cybersecurity & More — Kepler Codes";
const DEFAULT_PLAIN = `Hello!

Kepler Codes here 🚀

Are you looking to master Web Development, AI/ML, Cybersecurity, Competitive Programming or DSA?

Our educators bring real-world experience from Amazon, Google & Deutsche Bank to teach you industry-ready skills.

Join us today: https://kepler-22b.vercel.app/

— Team Kepler Codes`;

function plainToHtml(plain, subject) {
  const lines = plain.split("\n");
  const htmlLines = lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed) return "<br/>";
    // auto-link URLs
    const linked = trimmed.replace(
      /(https?:\/\/[^\s]+)/g,
      '<a href="$1" style="color:#1a1a1a;font-weight:bold;">$1</a>'
    );
    return `<p style="margin:0 0 8px 0;color:#444;line-height:1.7;font-size:15px;">${linked}</p>`;
  });

  return `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:10px;overflow:hidden;border:1px solid #eee;">
  <div style="background:#1a1a1a;padding:24px 28px;">
    <h1 style="color:#fff;margin:0;font-size:20px;font-weight:600;">${subject}</h1>
  </div>
  <div style="padding:28px;">
    ${htmlLines.join("\n")}
    <div style="margin-top:24px;">
      <a href="https://kepler-22b.vercel.app/"
         style="display:inline-block;background:#1a1a1a;color:#fff;padding:12px 28px;
                border-radius:6px;text-decoration:none;font-weight:bold;font-size:15px;">
        Join Kepler Codes →
      </a>
    </div>
  </div>
  <div style="background:#f5f4f0;padding:16px 28px;border-top:1px solid #eee;">
    <p style="margin:0;font-size:12px;color:#888;">
      Kepler Codes &nbsp;|&nbsp;
      <a href="https://kepler-22b.vercel.app/" style="color:#888;">kepler-22b.vercel.app</a>
    </p>
  </div>
</div>`;
}

function formatTime(date) {
  return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) +
    " · " + new Date(date).toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function MailBot() {
  const [emails, setEmails] = useState([]);
  const [subject, setSubject] = useState(DEFAULT_SUBJECT);
  const [plainText, setPlainText] = useState(DEFAULT_PLAIN);
  const [log, setLog] = useState([]);
  const [status, setStatus] = useState({ msg: "", type: "" });
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [manualEmail, setManualEmail] = useState("");
  const [activeTab, setActiveTab] = useState("compose");
  const [sendProgress, setSendProgress] = useState({ current: 0, total: 0 });
  const [showPreview, setShowPreview] = useState(false);
  const fileRef = useRef();

  const htmlBody = plainToHtml(plainText, subject);

  async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setStatus({ msg: "Parsing file...", type: "info" });
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/parse-file", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setEmails((prev) => [...new Set([...prev, ...data.emails])]);
      setStatus({ msg: `Found ${data.count} email(s) from file!`, type: "success" });
    } catch (err) {
      setStatus({ msg: "Error: " + err.message, type: "error" });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function addManualEmail() {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const val = manualEmail.trim();
    if (!emailRegex.test(val)) return setStatus({ msg: "Invalid email address.", type: "error" });
    if (emails.includes(val)) return setStatus({ msg: "Email already in list.", type: "error" });
    setEmails((prev) => [...prev, val]);
    setManualEmail("");
    setStatus({ msg: "", type: "" });
  }

  function removeEmail(email) { setEmails((prev) => prev.filter((e) => e !== email)); }
  function clearEmails() { setEmails([]); }

  async function sendEmails() {
    if (emails.length === 0) return setStatus({ msg: "No emails in list.", type: "error" });
    if (!subject.trim()) return setStatus({ msg: "Subject is empty.", type: "error" });
    if (!plainText.trim()) return setStatus({ msg: "Message is empty.", type: "error" });

    setSending(true);
    setSendProgress({ current: 0, total: emails.length });
    let successCount = 0, failCount = 0;

    for (let i = 0; i < emails.length; i++) {
      const email = emails[i];
      setSendProgress({ current: i + 1, total: emails.length });
      try {
        const res = await fetch("/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ to: email, subject, body: htmlBody }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        successCount++;
        setLog((prev) => [{ email, status: "sent", timestamp: new Date().toISOString(), subject }, ...prev]);
      } catch (err) {
        failCount++;
        setLog((prev) => [{ email, status: "failed", timestamp: new Date().toISOString(), subject, error: err.message }, ...prev]);
      }
      await new Promise((r) => setTimeout(r, 500));
    }

    setSending(false);
    setSendProgress({ current: 0, total: 0 });
    setStatus({ msg: `Done! ${successCount} sent, ${failCount} failed.`, type: failCount === 0 ? "success" : "error" });
  }

  return (
    <div style={s.page}>
      <div style={s.container}>
        <div style={s.header}>
          <h1 style={s.h1}>Kepler Codes — mail bot</h1>
          <p style={s.subtitle}>Write your message in plain text — it gets auto-styled into a beautiful email</p>
        </div>

        <div style={s.tabs}>
          {["compose", "emails", "log"].map((tab) => (
            <button key={tab} style={{ ...s.tab, ...(activeTab === tab ? s.tabActive : {}) }}
              onClick={() => setActiveTab(tab)}>
              {tab === "compose" ? "Compose" : tab === "emails" ? `Email list (${emails.length})` : `Send log (${log.length})`}
            </button>
          ))}
        </div>

        {/* COMPOSE TAB */}
        {activeTab === "compose" && (
          <div style={s.card}>
            <p style={s.cardTitle}>Write your message</p>

            <label style={s.label}>Subject line</label>
            <input style={s.input} value={subject} onChange={(e) => setSubject(e.target.value)} />

            <label style={{ ...s.label, marginTop: 14 }}>
              Mail you want to write
              <span style={s.hint}> — plain text, we handle the styling</span>
            </label>
            <textarea
              style={{ ...s.textarea, minHeight: 220 }}
              placeholder="Write your message here in plain text..."
              value={plainText}
              onChange={(e) => setPlainText(e.target.value)}
            />
            <div style={{ textAlign: "right", fontSize: 12, color: "#888", marginTop: 4 }}>
              {plainText.length} characters
            </div>

            <div style={{ ...s.row, marginTop: 12 }}>
              <button style={s.previewBtn} onClick={() => setShowPreview(!showPreview)}>
                {showPreview ? "Hide preview" : "Show email preview"}
              </button>
              <button style={s.btn} onClick={() => { setSubject(DEFAULT_SUBJECT); setPlainText(DEFAULT_PLAIN); }}>
                Reset to default
              </button>
            </div>

            {showPreview && (
              <div style={s.previewWrap}>
                <div style={s.previewLabel}>Email preview — exactly what recipients will see</div>
                <div style={s.preview} dangerouslySetInnerHTML={{ __html: htmlBody }} />
              </div>
            )}

            {status.msg && (
              <div style={{ ...s.statusBox, ...s["status_" + status.type] }}>{status.msg}</div>
            )}

            <div style={{ ...s.row, marginTop: 14 }}>
              <button
                style={{ ...s.btn, ...s.btnPrimary, opacity: sending ? 0.5 : 1 }}
                onClick={sendEmails} disabled={sending}>
                {sending ? `Sending ${sendProgress.current}/${sendProgress.total}...` : `Send to ${emails.length} email${emails.length !== 1 ? "s" : ""} ↗`}
              </button>
            </div>
          </div>
        )}

        {/* EMAILS TAB */}
        {activeTab === "emails" && (
          <div style={s.card}>
            <p style={s.cardTitle}>Upload CSV or Excel to extract emails</p>
            <div style={s.uploadBox} onClick={() => fileRef.current.click()}>
              <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls"
                style={{ display: "none" }} onChange={handleFileUpload} />
              <div style={{ fontSize: 13, color: "#5F5E5A", textAlign: "center" }}>
                {uploading ? "Parsing file..." : (
                  <>
                    <div style={{ fontSize: 24, marginBottom: 8 }}>📂</div>
                    <div>Click to upload <strong>.csv</strong> or <strong>.xlsx</strong> file</div>
                    <div style={{ fontSize: 12, marginTop: 4, color: "#888" }}>Automatically extracts all email addresses</div>
                  </>
                )}
              </div>
            </div>

            <div style={{ ...s.row, marginTop: 12 }}>
              <input style={{ ...s.input, flex: 1 }} placeholder="Or add email manually..."
                value={manualEmail} onChange={(e) => setManualEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addManualEmail()} />
              <button style={s.btn} onClick={addManualEmail}>Add</button>
            </div>

            {status.msg && (
              <div style={{ ...s.statusBox, ...s["status_" + status.type] }}>{status.msg}</div>
            )}

            {emails.length > 0 && (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "#2C2C2A" }}>
                    {emails.length} email{emails.length !== 1 ? "s" : ""} saved
                  </span>
                  <button style={s.clearBtn} onClick={clearEmails}>Clear all</button>
                </div>
                <div style={s.emailList}>
                  {emails.map((email, i) => (
                    <div key={i} style={s.emailItem}>
                      <span style={{ fontSize: 13, color: "#2C2C2A" }}>{email}</span>
                      <button style={s.removeBtn} onClick={() => removeEmail(email)}>✕</button>
                    </div>
                  ))}
                </div>
              </>
            )}
            {emails.length === 0 && <p style={s.empty}>No emails yet — upload a file or add manually</p>}
          </div>
        )}

        {/* LOG TAB */}
        {activeTab === "log" && (
          <div style={s.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <p style={{ ...s.cardTitle, margin: 0 }}>
                Send log —{" "}
                <span style={{ color: "#3B6D11" }}>{log.filter(l => l.status === "sent").length} sent</span>
                {" / "}
                <span style={{ color: "#A32D2D" }}>{log.filter(l => l.status === "failed").length} failed</span>
              </p>
              {log.length > 0 && <button style={s.clearBtn} onClick={() => setLog([])}>Clear</button>}
            </div>
            {log.length === 0 ? <p style={s.empty}>No emails sent yet</p> : (
              log.map((item, i) => (
                <div key={i} style={s.logItem}>
                  <div style={s.logMeta}>
                    <span style={s.logTime}>{formatTime(item.timestamp)}</span>
                    <span style={{ ...s.logTag, background: item.status === "sent" ? "#EAF3DE" : "#FCEBEB", color: item.status === "sent" ? "#3B6D11" : "#A32D2D" }}>
                      {item.status}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: "#2C2C2A" }}>{item.email}</div>
                  {item.error && <div style={{ fontSize: 12, color: "#A32D2D", marginTop: 2 }}>{item.error}</div>}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: "100vh", background: "#f5f4f0", padding: "2rem 1rem", fontFamily: "system-ui, -apple-system, sans-serif" },
  container: { maxWidth: 680, margin: "0 auto" },
  header: { marginBottom: "1.5rem" },
  h1: { fontSize: 20, fontWeight: 500, color: "#2C2C2A", margin: 0 },
  subtitle: { fontSize: 13, color: "#5F5E5A", marginTop: 4 },
  tabs: { display: "flex", gap: 4, marginBottom: 12 },
  tab: { padding: "8px 16px", fontSize: 13, fontFamily: "inherit", borderRadius: 8, cursor: "pointer", border: "0.5px solid #D3D1C7", background: "transparent", color: "#5F5E5A" },
  tabActive: { background: "#2C2C2A", color: "#fff", border: "none" },
  card: { background: "#fff", border: "0.5px solid #D3D1C7", borderRadius: 12, padding: "1.25rem", marginBottom: "1rem" },
  cardTitle: { fontSize: 13, fontWeight: 500, color: "#2C2C2A", marginBottom: 12 },
  label: { display: "block", fontSize: 12, color: "#5F5E5A", marginBottom: 5 },
  hint: { color: "#888", fontWeight: 400 },
  input: { width: "100%", fontSize: 14, padding: "8px 10px", border: "0.5px solid #D3D1C7", borderRadius: 8, outline: "none", fontFamily: "inherit", boxSizing: "border-box", background: "#fff", color: "#2C2C2A" },
  textarea: { width: "100%", fontSize: 14, padding: "8px 10px", border: "0.5px solid #D3D1C7", borderRadius: 8, outline: "none", fontFamily: "inherit", boxSizing: "border-box", resize: "vertical", background: "#fff", color: "#2C2C2A" },
  previewWrap: { marginTop: 16, border: "0.5px solid #D3D1C7", borderRadius: 10, overflow: "hidden" },
  previewLabel: { fontSize: 11, color: "#888", background: "#f5f4f0", padding: "6px 12px", borderBottom: "0.5px solid #D3D1C7" },
  preview: { padding: "16px", background: "#fafaf8" },
  uploadBox: { border: "1.5px dashed #D3D1C7", borderRadius: 10, padding: "2rem 1rem", cursor: "pointer", background: "#fafaf8" },
  row: { display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" },
  btn: { display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", fontSize: 14, fontFamily: "inherit", borderRadius: 8, cursor: "pointer", border: "0.5px solid #D3D1C7", background: "transparent", color: "#2C2C2A" },
  btnPrimary: { background: "#2C2C2A", color: "#fff", border: "none" },
  previewBtn: { display: "inline-flex", alignItems: "center", padding: "8px 16px", fontSize: 14, fontFamily: "inherit", borderRadius: 8, cursor: "pointer", border: "0.5px solid #D3D1C7", background: "transparent", color: "#185FA5" },
  statusBox: { fontSize: 13, padding: "8px 12px", borderRadius: 8, marginTop: 10 },
  status_info: { background: "#E6F1FB", color: "#185FA5" },
  status_success: { background: "#EAF3DE", color: "#3B6D11" },
  status_error: { background: "#FCEBEB", color: "#A32D2D" },
  emailList: { maxHeight: 300, overflowY: "auto", border: "0.5px solid #D3D1C7", borderRadius: 8 },
  emailItem: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", borderBottom: "0.5px solid #D3D1C7" },
  removeBtn: { background: "none", border: "none", cursor: "pointer", color: "#888", fontSize: 12, padding: "2px 6px" },
  clearBtn: { fontSize: 12, color: "#A32D2D", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0 },
  logItem: { padding: "10px 0", borderBottom: "0.5px solid #D3D1C7" },
  logMeta: { display: "flex", gap: 8, alignItems: "center", marginBottom: 4 },
  logTime: { fontSize: 11, color: "#888780" },
  logTag: { fontSize: 11, padding: "1px 7px", borderRadius: 6 },
  empty: { textAlign: "center", padding: "2rem", color: "#888780", fontSize: 13 },
};
