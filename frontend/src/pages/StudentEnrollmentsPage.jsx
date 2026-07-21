import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import MainLayout from "../components/layout/MainLayout";
import ResourceModal from "../components/ui/ResourceModal";
import { ResourceAlert, ResourceEmpty, ResourceLoading } from "../components/ui/ResourceState";
import { displayUsername, extractApiError, formatDate, normalizeList } from "../utils/data";
import "../styles/resources.css";

const initialForm = { student_id: "", group_id: "" };

function StudentEnrollmentsPage() {
  const [enrollments, setEnrollments] = useState([]);
  const [students, setStudents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadData() {
    setLoading(true); setError("");
    try {
      const [enrollmentsResponse, studentsResponse, groupsResponse] = await Promise.all([
        api.get("/education/student-enrollments/"),
        api.get("/accounts/students/"),
        api.get("/education/groups/"),
      ]);
      setEnrollments(normalizeList(enrollmentsResponse.data));
      setStudents(normalizeList(studentsResponse.data));
      setGroups(normalizeList(groupsResponse.data));
    } catch (requestError) {
      setError(extractApiError(requestError, "Маълумоти қабули донишҷӯён гирифта нашуд."));
    } finally { setLoading(false); }
  }

  useEffect(() => { loadData(); }, []);

  const filteredEnrollments = useMemo(() => {
    const query = search.trim().toLowerCase();
    return enrollments.filter((enrollment) => {
      if (statusFilter !== "all" && enrollment.status !== statusFilter) return false;
      if (!query) return true;
      return [enrollment.id, displayUsername(enrollment.student), enrollment.group?.title, enrollment.group?.course?.title, enrollment.status]
        .filter(Boolean).join(" ").toLowerCase().includes(query);
    });
  }, [enrollments, search, statusFilter]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault(); setSaving(true); setError("");
    try {
      await api.post("/education/student-enrollments/", {
        student_id: Number(form.student_id), group_id: Number(form.group_id),
      });
      setSuccess("Донишҷӯ ба гурӯҳ қабул шуд."); setModalOpen(false); await loadData();
    } catch (requestError) {
      setError(extractApiError(requestError, "Донишҷӯ ба гурӯҳ қабул нашуд."));
    } finally { setSaving(false); }
  }

  async function markAsFinished(enrollment) {
    if (!window.confirm(`Курси ${displayUsername(enrollment.student)} ба finished гузарад?`)) return;
    setUpdatingId(enrollment.id); setError("");
    try {
      await api.patch(`/education/student-enrollments/${enrollment.id}/`, { status: "finished" });
      setSuccess("Enrollment ба finished гузашт ва дар history монд.");
      await loadData();
    } catch (requestError) {
      setError(extractApiError(requestError, "Status тағйир дода нашуд."));
    } finally { setUpdatingId(null); }
  }

  return (
    <MainLayout title="Қабули донишҷӯ" description="Донишҷӯро ба гурӯҳ сабт кунед ва course history-ро нигоҳ доред.">
      <div className="resource-page">
        <ResourceAlert type="error" onClose={() => setError("")}>{error}</ResourceAlert>
        <ResourceAlert type="success" onClose={() => setSuccess("")}>{success}</ResourceAlert>

        <section className="resource-kpi-grid resource-kpi-grid-four">
          <article className="resource-kpi-card"><span>Ҳамагӣ</span><strong>{enrollments.length}</strong><small>enrollment</small></article>
          <article className="resource-kpi-card"><span>Active</span><strong>{enrollments.filter((e) => e.status === "active").length}</strong><small>курс</small></article>
          <article className="resource-kpi-card"><span>Finished</span><strong>{enrollments.filter((e) => e.status === "finished").length}</strong><small>history</small></article>
          <article className="resource-kpi-card"><span>Донишҷӯён</span><strong>{students.length}</strong><small>профил</small></article>
        </section>

        <section className="resource-card">
          <header className="resource-toolbar">
            <div className="resource-search"><span>⌕</span><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Донишҷӯ, гурӯҳ ё курс..." /></div>
            <div className="resource-toolbar-actions">
              <select className="resource-select-compact" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="all">Ҳамаи status</option><option value="active">Active</option><option value="finished">Finished</option></select>
              <button type="button" className="resource-button resource-button-ghost" onClick={loadData}>Навсозӣ</button>
              <button type="button" className="resource-button resource-button-primary" onClick={() => { setForm(initialForm); setModalOpen(true); }}>+ Қабули нав</button>
            </div>
          </header>

          {loading ? <ResourceLoading /> : filteredEnrollments.length === 0 ? (
            <ResourceEmpty title="Enrollment ёфт нашуд" description="Донишҷӯро ба гурӯҳи фаъол сабт кунед." actionLabel="Қабули нав" onAction={() => setModalOpen(true)} />
          ) : (
            <div className="resource-table-wrapper"><table className="resource-table"><thead><tr><th>Донишҷӯ</th><th>Гурӯҳ</th><th>Курс</th><th>Санаи сабт</th><th>Status</th><th>Амал</th></tr></thead><tbody>
              {filteredEnrollments.map((enrollment) => <tr key={enrollment.id}>
                <td><div className="resource-person"><div className="resource-avatar">{displayUsername(enrollment.student).charAt(0).toUpperCase()}</div><div><strong>{displayUsername(enrollment.student)}</strong><span>Enrollment #{enrollment.id}</span></div></div></td>
                <td>{enrollment.group?.title || "—"}</td><td>{enrollment.group?.course?.title || "—"}</td><td>{formatDate(enrollment.created_at)}</td>
                <td><span className={`resource-badge ${enrollment.status === "active" ? "resource-badge-success" : "resource-badge-muted"}`}>{enrollment.status}</span></td>
                <td>{enrollment.status === "active" ? <button type="button" className="resource-button resource-button-warning resource-button-small" onClick={() => markAsFinished(enrollment)} disabled={updatingId === enrollment.id}>{updatingId === enrollment.id ? "..." : "Mark as finished"}</button> : <span className="history-label">Дар history</span>}</td>
              </tr>)}
            </tbody></table></div>
          )}
        </section>
      </div>

      <ResourceModal open={modalOpen} title="Қабули донишҷӯ" description="Backend duplicate course ва як active course-ро месанҷад." loading={saving} onClose={() => setModalOpen(false)} onSubmit={handleSubmit}>
        <div className="resource-form-grid">
          <label className="resource-field resource-field-full"><span>Донишҷӯ</span><select name="student_id" value={form.student_id} onChange={handleChange} required><option value="">Интихоб кунед</option>{students.map((student) => <option key={student.id} value={student.id}>{displayUsername(student)}</option>)}</select></label>
          <label className="resource-field resource-field-full"><span>Гурӯҳ</span><select name="group_id" value={form.group_id} onChange={handleChange} required><option value="">Интихоб кунед</option>{groups.map((group) => <option key={group.id} value={group.id}>{group.title} — {group.course?.title}</option>)}</select></label>
          <div className="resource-form-note resource-field-full"><strong>Business rule</strong><p>Донишҷӯ танҳо як active course дошта метавонад. Duplicate enrollment ба ҳамон course манъ аст.</p></div>
        </div>
      </ResourceModal>
    </MainLayout>
  );
}

export default StudentEnrollmentsPage;
