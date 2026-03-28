import { useState, useRef } from "react";

const DEFAULT_SUBJECT = "Learn Web Dev, AI/ML, Cybersecurity & More — Kepler Codes";
const DEFAULT_BODY = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #1a1a1a;">Hello from Kepler Codes! 🚀</h2>
  <p style="color: #444; line-height: 1.6;">
    Are you looking to master <strong>Web Development, AI/ML, Cybersecurity, Competitive Programming or DSA</strong>?
  </p>
  <p style="color: #444; line-height: 1.6;">
    At <strong>Kepler Codes</strong>, our educators bring real-world experience from 
    <strong>Amazon, Google & Deutsche Bank</strong> to teach you industry-ready skills.
  </p>
  <a href="https://kepler-22b.vercel.app/" 
     style="display: inline-block; background: #1a1a1a; color: #fff; padding: 12px 24px; 
            border-radius: 6px; text-decoration: none; margin: 16px 0; font-weight: bold;">
    Join Kepler Codes →
  </a>
  <p style="color: #888; font-size: 13px; margin-top: 24px;">
    Kepler Codes | <a href="https://kepler-22b.vercel.app/" style="color: #888;">kepler-22b.vercel.app</a>
  </p>
</div>`;

function formatTime(date) {
  return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) +
    " · " + new Date(date).toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function MailBot() {
  const [emails, setEmails] = useState([]);
  const [subject, setSubject] = useState(DEFAULT_SUBJECT);
  const [body, setBody] = useState(DEFAULT_BODY);
  const [log, setLog] = useState([]);
  const [status, setStatus] = useState({ msg: "", type: "" });
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [manualEmail, setManualEmail] = useState("");
  const [activeTab, setActiveTab] = useState("compose");
  const [sendProgress, setSendProgress] = useState({ current: 0, total: 0 });
  const fileRef = useRef();

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

      setEmails((prev) => {
        const combined = [...new Set([...prev, ...data.emails])];
        return combined;
      });
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

  function removeEmail(email) {
    setEmails((prev) => prev.filter((e) => e !== email));
  }

  function clearEmails() {
    setEmails([]);
  }

  async function sendEmails() {
    if (emails.length === 0) return setStatus({ msg: "No emails in list.", type: "error" });
    if (!subject.trim()) return setStatus({ msg: "Subject is empty.", type: "error" });
    if (!body.trim()) return setStatus({ msg: "Email body is empty.", type: "error" });

    setSending(true);
    setSendProgress({ current: 0, total: emails.length });

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < emails.length; i++) {
      const email = emails[i];
      setSendProgress({ current: i + 1, total: emails.length });

      try {
        const res = await fetch("/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ to: email, subject, body }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        successCount++;
        setLog((prev) => [{
          email, status: "sent", timestamp: new Date().toISOString(), subject
        }, ...prev]);
      } catch (err) {
        failCount++;
        setLog((prev) => [{
          email, status: "failed", timestamp: new Date().toISOString(), subject, error: err.message
        }, ...prev]);
      }

      await new Promise((r) => setTimeout(r, 500));
    }

    setSending(false);
    setSendProgress({ current: 0, total: 0 });
    setStatus({
      msg: `Done! ${successCount} sent, ${failCount} failed.`,
      type: failCount === 0 ? "success" : "error"
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return (
    <div style={s.page}>
      <div style={s.container}>

        <div style={s.header}>
          <h1 style={s.h1}>Kepler Codes — mail bot</h1>
          <p style={s.subtitle}>Upload a CSV/Excel to fetch emails, compose your message, send in bulk</p>
        </div>

        {/* Tabs */}
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
            <p style={s.cardTitle}>Email content</p>

            <label style={s.label}>Subject</label>
            <input style={s.input} value={subject} onChange={(e) => setSubject(e.target.value)} />

            <label style={{ ...s.label, marginTop: 14 }}>Body (HTML supported)</label>
            <textarea style={{ ...s.textarea, minHeight: 200 }} value={body}
              onChange={(e) => setBody(e.target.value)} />

            <label style={{ ...s.label, marginTop: 14 }}>Preview</label>
            <div style={s.preview} dangerouslySetInnerHTML={{ __html: body }} />

            {status.msg && (
              <div style={{ ...s.statusBox, ...s["status_" + status.type] }}>{status.msg}</div>
            )}

            <div style={s.row}>
              <button style={{ ...s.btn, ...s.btnPrimary, opacity: sending ? 0.5 : 1 }}
                onClick={sendEmails} disabled={sending}>
                {sending
                  ? `Sending ${sendProgress.current}/${sendProgress.total}...`
                  : `Send to ${emails.length} email${emails.length !== 1 ? "s" : ""} ↗`}
              </button>
              <button style={s.btn} onClick={() => { setSubject(DEFAULT_SUBJECT); setBody(DEFAULT_BODY); }}>
                Reset to default
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
                    <div style={{ fontSize: 12, marginTop: 4, color: "#888" }}>
                      It will automatically extract all email addresses
                    </div>
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

            {emails.length === 0 && (
              <p style={s.empty}>No emails yet — upload a file or add manually</p>
            )}
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

            {log.length === 0 ? (
              <p style={s.empty}>No emails sent yet</p>
            ) : (
              log.map((item, i) => (
                <div key={i} style={s.logItem}>
                  <div style={s.logMeta}>
                    <span style={s.logTime}>{formatTime(item.timestamp)}</span>
                    <span style={{
                      ...s.logTag,
                      background: item.status === "sent" ? "#EAF3DE" : "#FCEBEB",
                      color: item.status === "sent" ? "#3B6D11" : "#A32D2D"
                    }}>{item.status}</span>
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
  input: { width: "100%", fontSize: 14, padding: "8px 10px", border: "0.5px solid #D3D1C7", borderRadius: 8, outline: "none", fontFamily: "inherit", boxSizing: "border-box", background: "#fff", color: "#2C2C2A" },
  textarea: { width: "100%", fontSize: 13, padding: "8px 10px", border: "0.5px solid #D3D1C7", borderRadius: 8, outline: "none", fontFamily: "monospace", boxSizing: "border-box", resize: "vertical", background: "#fff", color: "#2C2C2A" },
  preview: { border: "0.5px solid #D3D1C7", borderRadius: 8, padding: "12px", marginTop: 4, background: "#fafaf8", minHeight: 80 },
  uploadBox: { border: "1.5px dashed #D3D1C7", borderRadius: 10, padding: "2rem 1rem", cursor: "pointer", background: "#fafaf8", marginBottom: 4 },
  row: { display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap", alignItems: "center" },
  btn: { display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", fontSize: 14, fontFamily: "inherit", borderRadius: 8, cursor: "pointer", border: "0.5px solid #D3D1C7", background: "transparent", color: "#2C2C2A" },
  btnPrimary: { background: "#2C2C2A", color: "#fff", border: "none" },
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
