import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient.js";
import StampBadge from "../components/StampBadge.jsx";
import {
  CATEGORIES,
  CHECKLISTS,
  AUTHORITIES,
  PHASES,
  STATUSES,
  docsProgress,
  emptyDocuments,
} from "../constants.js";

function emptyForm() {
  return {
    id: null,
    villa_number: "",
    phase: "Phase 1",
    block: "",
    category: "Construction",
    authority: "Meydan",
    status: "Pending",
    permit_number: "",
    contractor_id: "",
    date_submitted: "",
    date_approved: "",
    expiry_date: "",
    notes: "",
    documents: emptyDocuments("Construction"),
  };
}

export default function AdminDashboard({ profile, onLogout }) {
  const [records, setRecords] = useState([]);
  const [contractors, setContractors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [filters, setFilters] = useState({ category: "All", status: "All", phase: "All", search: "" });

  async function loadData() {
    setLoading(true);
    const [{ data: recs }, { data: people }] = await Promise.all([
      supabase.from("records").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("id, full_name, role").eq("role", "contractor"),
    ]);
    setRecords(recs || []);
    setContractors(people || []);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  const filtered = useMemo(
    () =>
      records.filter((r) => {
        if (filters.category !== "All" && r.category !== filters.category) return false;
        if (filters.status !== "All" && r.status !== filters.status) return false;
        if (filters.phase !== "All" && r.phase !== filters.phase) return false;
        if (filters.search) {
          const q = filters.search.toLowerCase();
          const hay = `${r.villa_number} ${r.block} ${r.permit_number || ""}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      }),
    [records, filters]
  );

  const stats = useMemo(
    () => ({
      total: records.length,
      approved: records.filter((r) => r.status === "Approved" || r.status === "Completed").length,
      pending: records.filter((r) => ["Pending", "Submitted", "Under Review"].includes(r.status)).length,
      inProgress: records.filter((r) => r.status === "In Progress").length,
    }),
    [records]
  );

  function openNew() {
    setForm(emptyForm());
    setShowForm(true);
  }

  function openEdit(r) {
    setForm({ ...r, contractor_id: r.contractor_id || "" });
    setShowForm(true);
  }

  function handleCategoryChange(cat) {
    const fresh = emptyDocuments(cat);
    const merged = {};
    Object.keys(fresh).forEach((k) => {
      merged[k] = form.documents && form.documents[k] ? true : false;
    });
    setForm((f) => ({ ...f, category: cat, documents: merged }));
  }

  function toggleDoc(item) {
    setForm((f) => ({ ...f, documents: { ...f.documents, [item]: !f.documents[item] } }));
  }

  async function saveForm() {
    if (!form.villa_number.trim()) return;
    setSaving(true);
    const payload = {
      villa_number: form.villa_number,
      phase: form.phase,
      block: form.block,
      category: form.category,
      authority: form.authority,
      status: form.status,
      permit_number: form.permit_number,
      contractor_id: form.contractor_id || null,
      date_submitted: form.date_submitted || null,
      date_approved: form.date_approved || null,
      expiry_date: form.expiry_date || null,
      notes: form.notes,
      documents: form.documents,
    };

    if (form.id) {
      await supabase.from("records").update(payload).eq("id", form.id);
    } else {
      await supabase.from("records").insert(payload);
    }
    setSaving(false);
    setShowForm(false);
    loadData();
  }

  async function deleteRecord(id) {
    await supabase.from("records").delete().eq("id", id);
    setConfirmDeleteId(null);
    loadData();
  }

  function contractorName(id) {
    const c = contractors.find((c) => c.id === id);
    return c ? c.full_name || c.id.slice(0, 8) : "Unassigned";
  }

  return (
    <div style={{ minHeight: "100vh" }}>
      <div className="grid-bg" style={{ borderBottom: "1px solid var(--panel-line)" }}>
        <div className="container" style={{ paddingTop: "32px", paddingBottom: "32px" }}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div
                style={{ color: "var(--cyan)", fontFamily: "'IBM Plex Mono', monospace", fontSize: "11px", letterSpacing: "0.15em" }}
              >
                DISTRICT ONE · MBR CITY · ADMIN
              </div>
              <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "30px", margin: "6px 0 0" }}>
                Villa Permit Ledger
              </h1>
              <div style={{ color: "var(--text-muted)", fontSize: "13px", marginTop: "4px" }}>
                Signed in as {profile.full_name || "Admin"}
              </div>
            </div>
            <div className="flex gap-2">
              <button className="btn-primary flex items-center gap-2" onClick={openNew}>
                + New Record
              </button>
              <button className="btn-secondary" onClick={onLogout}>
                Log out
              </button>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: "12px",
              marginTop: "28px",
            }}
          >
            <StatCard label="Total Villas" value={stats.total} color="var(--text-light)" />
            <StatCard label="Approved / Completed" value={stats.approved} color="var(--green)" />
            <StatCard label="Pending / In Review" value={stats.pending} color="var(--amber)" />
            <StatCard label="In Progress" value={stats.inProgress} color="var(--cyan)" />
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: "24px", paddingBottom: "40px" }}>
        <div className="flex flex-wrap gap-3" style={{ marginBottom: "20px" }}>
          <input
            className="input"
            style={{ flex: 1, minWidth: "180px" }}
            placeholder="Search villa, block, permit no..."
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          />
          <select
            className="input"
            style={{ width: "auto" }}
            value={filters.category}
            onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
          >
            <option>All</option>
            {CATEGORIES.map((c) => (
              <option key={c.key}>{c.key}</option>
            ))}
          </select>
          <select
            className="input"
            style={{ width: "auto" }}
            value={filters.status}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
          >
            <option>All</option>
            {STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <select
            className="input"
            style={{ width: "auto" }}
            value={filters.phase}
            onChange={(e) => setFilters((f) => ({ ...f, phase: e.target.value }))}
          >
            <option>All</option>
            {PHASES.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div style={{ color: "var(--text-muted)", textAlign: "center", padding: "40px" }}>Loading records…</div>
        ) : filtered.length === 0 ? (
          <div
            style={{ border: "1px dashed var(--panel-line)", color: "var(--text-muted)", borderRadius: "6px", padding: "48px" }}
            className="flex flex-col items-center gap-2"
          >
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", color: "white" }}>
              {records.length === 0 ? "No records yet" : "No records match these filters"}
            </div>
            {records.length === 0 && (
              <button className="btn-primary" onClick={openNew} style={{ marginTop: "8px" }}>
                + Add first record
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((r) => {
              const prog = docsProgress(r.documents);
              return (
                <div key={r.id} className="paper-row flex flex-wrap items-center gap-3">
                  <div style={{ flex: 1, minWidth: "180px" }}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 }}>{r.villa_number}</span>
                      {r.block && (
                        <span style={{ color: "var(--text-paper-muted)", fontFamily: "'IBM Plex Mono', monospace", fontSize: "12px" }}>
                          Block {r.block}
                        </span>
                      )}
                      <span style={{ color: "var(--text-paper-muted)", fontSize: "12px" }}>· {r.phase}</span>
                    </div>
                    <div style={{ color: "var(--text-paper-muted)", fontSize: "12px", marginTop: "2px" }}>
                      {r.category} · {r.authority} · {contractorName(r.contractor_id)}
                      {r.permit_number ? ` · Permit ${r.permit_number}` : ""}
                    </div>
                  </div>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "12px", color: "var(--text-paper-muted)" }}>
                    {prog.done}/{prog.total} docs
                  </div>
                  <StampBadge status={r.status} />
                  <div className="flex gap-1">
                    <button className="btn-secondary" style={{ padding: "6px 10px" }} onClick={() => openEdit(r)}>
                      Edit
                    </button>
                    {confirmDeleteId === r.id ? (
                      <>
                        <button
                          className="btn-secondary"
                          style={{ padding: "6px 10px", color: "var(--red)", borderColor: "var(--red)" }}
                          onClick={() => deleteRecord(r.id)}
                        >
                          Confirm
                        </button>
                        <button className="btn-secondary" style={{ padding: "6px 10px" }} onClick={() => setConfirmDeleteId(null)}>
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button className="btn-secondary" style={{ padding: "6px 10px" }} onClick={() => setConfirmDeleteId(r.id)}>
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showForm && (
        <FormModal
          form={form}
          setForm={setForm}
          contractors={contractors}
          onCategoryChange={handleCategoryChange}
          onToggleDoc={toggleDoc}
          onCancel={() => setShowForm(false)}
          onSave={saveForm}
          saving={saving}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="card" style={{ padding: "14px" }}>
      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "24px", fontWeight: 700, color }}>{value}</div>
      <div style={{ color: "var(--text-muted)", fontSize: "11px", marginTop: "4px" }}>{label}</div>
    </div>
  );
}

function FormModal({ form, setForm, contractors, onCategoryChange, onToggleDoc, onCancel, onSave, saving }) {
  return (
    <div
      onClick={onCancel}
      style={{ position: "fixed", inset: 0, background: "rgba(10,20,32,0.6)", zIndex: 50, display: "flex", justifyContent: "flex-end" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: "var(--ink-deep)", borderLeft: "1px solid var(--panel-line)", width: "100%", maxWidth: "480px", height: "100%", overflowY: "auto" }}
      >
        <div style={{ borderBottom: "1px solid var(--panel-line)", padding: "20px 24px" }} className="flex items-center justify-between">
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "18px" }}>
            {form.id ? "Edit record" : "New record"}
          </h2>
          <button onClick={onCancel} style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: "20px" }}>
            ×
          </button>
        </div>

        <div className="flex flex-col gap-4" style={{ padding: "20px 24px" }}>
          <div>
            <label className="label">Villa / Unit number *</label>
            <input
              className="input"
              value={form.villa_number}
              onChange={(e) => setForm((f) => ({ ...f, villa_number: e.target.value }))}
              placeholder="e.g. D1-3A-112"
            />
          </div>

          <div className="flex gap-3">
            <div style={{ flex: 1 }}>
              <label className="label">Phase</label>
              <select className="input" value={form.phase} onChange={(e) => setForm((f) => ({ ...f, phase: e.target.value }))}>
                {PHASES.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label className="label">Block / Cluster</label>
              <input className="input" value={form.block} onChange={(e) => setForm((f) => ({ ...f, block: e.target.value }))} />
            </div>
          </div>

          <div>
            <label className="label">Work category</label>
            <select className="input" value={form.category} onChange={(e) => onCategoryChange(e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c.key}>{c.key}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3">
            <div style={{ flex: 1 }}>
              <label className="label">Authority</label>
              <select className="input" value={form.authority} onChange={(e) => setForm((f) => ({ ...f, authority: e.target.value }))}>
                {AUTHORITIES.map((a) => (
                  <option key={a}>{a}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
                {STATUSES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Assign contractor</label>
            <select
              className="input"
              value={form.contractor_id || ""}
              onChange={(e) => setForm((f) => ({ ...f, contractor_id: e.target.value }))}
            >
              <option value="">Unassigned</option>
              {contractors.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name || c.id.slice(0, 8)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Permit / NOC number</label>
            <input className="input" value={form.permit_number || ""} onChange={(e) => setForm((f) => ({ ...f, permit_number: e.target.value }))} />
          </div>

          <div className="flex gap-3">
            <div style={{ flex: 1 }}>
              <label className="label">Submitted</label>
              <input type="date" className="input" value={form.date_submitted || ""} onChange={(e) => setForm((f) => ({ ...f, date_submitted: e.target.value }))} />
            </div>
            <div style={{ flex: 1 }}>
              <label className="label">Approved</label>
              <input type="date" className="input" value={form.date_approved || ""} onChange={(e) => setForm((f) => ({ ...f, date_approved: e.target.value }))} />
            </div>
            <div style={{ flex: 1 }}>
              <label className="label">Expiry</label>
              <input type="date" className="input" value={form.expiry_date || ""} onChange={(e) => setForm((f) => ({ ...f, expiry_date: e.target.value }))} />
            </div>
          </div>

          <div>
            <label className="label">Document checklist — {form.category}</label>
            <div className="card flex flex-col gap-2" style={{ padding: "12px" }}>
              {Object.keys(form.documents || {}).map((item) => (
                <label key={item} className="flex items-center gap-2" style={{ fontSize: "14px", cursor: "pointer" }}>
                  <input type="checkbox" checked={!!form.documents[item]} onChange={() => onToggleDoc(item)} />
                  <span style={{ color: form.documents[item] ? "var(--text-light)" : "var(--text-muted)" }}>{item}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea
              className="input"
              rows={3}
              value={form.notes || ""}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              style={{ resize: "none" }}
            />
          </div>
        </div>

        <div style={{ borderTop: "1px solid var(--panel-line)", padding: "16px 24px" }} className="flex gap-3">
          <button className="btn-secondary" style={{ flex: 1 }} onClick={onCancel}>
            Cancel
          </button>
          <button className="btn-primary" style={{ flex: 1 }} onClick={onSave} disabled={!form.villa_number.trim() || saving}>
            {saving ? "Saving…" : form.id ? "Save changes" : "Add record"}
          </button>
        </div>
      </div>
    </div>
  );
                          }
