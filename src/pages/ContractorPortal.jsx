import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient.js";
import StampBadge from "../components/StampBadge.jsx";
import { STATUSES, docsProgress } from "../constants.js";

export default function ContractorPortal({ profile, onLogout }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [openId, setOpenId] = useState(null);

  async function loadData() {
    setLoading(true);
    const { data } = await supabase
      .from("records")
      .select("*")
      .eq("contractor_id", profile.id)
      .order("created_at", { ascending: false });
    setRecords(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function updateStatus(record, status) {
    setSavingId(record.id);
    await supabase.from("records").update({ status }).eq("id", record.id);
    await loadData();
    setSavingId(null);
  }

  async function toggleDoc(record, item) {
    setSavingId(record.id);
    const newDocs = { ...record.documents, [item]: !record.documents[item] };
    await supabase.from("records").update({ documents: newDocs }).eq("id", record.id);
    await loadData();
    setSavingId(null);
  }

  async function updateNotes(record, notes) {
    await supabase.from("records").update({ notes }).eq("id", record.id);
  }

  return (
    <div style={{ minHeight: "100vh" }}>
      <div className="grid-bg" style={{ borderBottom: "1px solid var(--panel-line)" }}>
        <div className="container flex items-center justify-between" style={{ paddingTop: "28px", paddingBottom: "28px" }}>
          <div>
            <div style={{ color: "var(--cyan)", fontFamily: "'IBM Plex Mono', monospace", fontSize: "11px", letterSpacing: "0.15em" }}>
              CONTRACTOR PORTAL
            </div>
            <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "26px", margin: "6px 0 0" }}>
              My Assigned Villas
            </h1>
            <div style={{ color: "var(--text-muted)", fontSize: "13px", marginTop: "4px" }}>
              {profile.full_name || "Contractor"}
            </div>
          </div>
          <button className="btn-secondary" onClick={onLogout}>
            Log out
          </button>
        </div>
      </div>

      <div className="container" style={{ paddingTop: "24px", paddingBottom: "40px" }}>
        {loading ? (
          <div style={{ color: "var(--text-muted)", textAlign: "center", padding: "40px" }}>Loading…</div>
        ) : records.length === 0 ? (
          <div
            style={{ border: "1px dashed var(--panel-line)", color: "var(--text-muted)", borderRadius: "6px", padding: "48px", textAlign: "center" }}
          >
            No villas are assigned to you yet. Contact your admin to get assigned to a record.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {records.map((r) => {
              const prog = docsProgress(r.documents);
              const isOpen = openId === r.id;
              return (
                <div key={r.id} className="paper-row">
                  <div className="flex flex-wrap items-center gap-3" style={{ cursor: "pointer" }} onClick={() => setOpenId(isOpen ? null : r.id)}>
                    <div style={{ flex: 1, minWidth: "180px" }}>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 }}>{r.villa_number}</span>
                        {r.block && (
                          <span style={{ color: "var(--text-paper-muted)", fontFamily: "'IBM Plex Mono', monospace", fontSize: "12px" }}>
                            Block {r.block}
                          </span>
                        )}
                      </div>
                      <div style={{ color: "var(--text-paper-muted)", fontSize: "12px", marginTop: "2px" }}>
                        {r.category} · {r.authority}
                      </div>
                    </div>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "12px", color: "var(--text-paper-muted)" }}>
                      {prog.done}/{prog.total} docs
                    </div>
                    <StampBadge status={r.status} />
                  </div>

                  {isOpen && (
                    <div style={{ marginTop: "16px", borderTop: "1px solid rgba(0,0,0,0.1)", paddingTop: "16px" }}>
                      <label className="label" style={{ color: "var(--text-paper-muted)" }}>
                        Update status
                      </label>
                      <select
                        className="input"
                        style={{ background: "white", color: "var(--text-paper)", border: "1px solid #d8cfb6", marginBottom: "14px" }}
                        value={r.status}
                        disabled={savingId === r.id}
                        onChange={(e) => updateStatus(r, e.target.value)}
                      >
                        {STATUSES.map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>

                      <label className="label" style={{ color: "var(--text-paper-muted)" }}>
                        Document checklist
                      </label>
                      <div className="flex flex-col gap-2" style={{ marginBottom: "14px" }}>
                        {Object.keys(r.documents || {}).map((item) => (
                          <label key={item} className="flex items-center gap-2" style={{ fontSize: "14px", cursor: "pointer" }}>
                            <input
                              type="checkbox"
                              checked={!!r.documents[item]}
                              disabled={savingId === r.id}
                              onChange={() => toggleDoc(r, item)}
                            />
                            <span>{item}</span>
                          </label>
                        ))}
                      </div>

                      <label className="label" style={{ color: "var(--text-paper-muted)" }}>
                        Notes
                      </label>
                      <textarea
                        className="input"
                        style={{ background: "white", color: "var(--text-paper)", border: "1px solid #d8cfb6" }}
                        rows={2}
                        defaultValue={r.notes || ""}
                        onBlur={(e) => updateNotes(r, e.target.value)}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div style={{ color: "var(--text-muted)", fontSize: "12px", marginTop: "24px", textAlign: "center" }}>
          You can only see and edit villas your admin has assigned to you.
        </div>
      </div>
    </div>
  );
            }
