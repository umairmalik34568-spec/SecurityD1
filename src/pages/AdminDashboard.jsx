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

      <div className="container" style={{
