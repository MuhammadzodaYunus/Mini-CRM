import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../api/axios";
import MainLayout from "../components/layout/MainLayout";
import ResourceModal from "../components/ui/ResourceModal";
import {
  ResourceAlert,
  ResourceEmpty,
  ResourceLoading,
} from "../components/ui/ResourceState";
import { useAuth } from "../context/AuthContext";
import {
  extractApiError,
  formatDate,
  normalizeList,
} from "../utils/data";

import "../styles/resources.css";
import "../styles/management.css";

const initialForm = {
  title: "",
  description: "",
  course_id: "",
  start_date: "",
  end_date: "",
  branch: "",
  status: "active",
};

function GroupsPage() {
  const navigate = useNavigate();
  const { role } = useAuth();
  const canManage = role === "admin";

  const [groups, setGroups] = useState([]);
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingGroup, setEditingGroup] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [groupsResponse, coursesResponse] = await Promise.all([
        api.get("/education/groups/"),
        api.get("/education/courses/"),
      ]);

      setGroups(normalizeList(groupsResponse.data));
      setCourses(normalizeList(coursesResponse.data));
    } catch (requestError) {
      setError(
        extractApiError(requestError, "Маълумоти гурӯҳҳо гирифта нашуд."),
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredGroups = useMemo(() => {
    const query = search.trim().toLowerCase();

    return groups.filter((group) => {
      if (statusFilter !== "all" && group.status !== statusFilter) {
        return false;
      }

      if (!query) return true;

      return [
        group.id,
        group.title,
        group.description,
        group.branch,
        group.course?.title,
        group.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [groups, search, statusFilter]);

  const activeGroupsCount = groups.filter(
    (group) => group.status === "active",
  ).length;
  const finishedGroupsCount = groups.filter(
    (group) => group.status === "finished",
  ).length;
  const studentsCount = groups.reduce(
    (sum, group) => sum + Number(group.students_count || 0),
    0,
  );
  const mentorsCount = groups.reduce(
    (sum, group) => sum + Number(group.mentors_count || 0),
    0,
  );

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function openCreateModal() {
    setEditingGroup(null);
    setForm(initialForm);
    setError("");
    setModalOpen(true);
  }

  function openEditModal(event, group) {
    event.stopPropagation();
    setEditingGroup(group);
    setForm({
      title: group.title || "",
      description: group.description || "",
      course_id: String(group.course?.id || ""),
      start_date: group.start_date || "",
      end_date: group.end_date || "",
      branch: group.branch || "",
      status: group.status || "active",
    });
    setError("");
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;
    setModalOpen(false);
    setEditingGroup(null);
    setForm(initialForm);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      course_id: Number(form.course_id),
      start_date: form.start_date,
      end_date: form.end_date,
      branch: form.branch.trim(),
      status: form.status,
    };

    try {
      if (editingGroup) {
        await api.patch(`/education/groups/${editingGroup.id}/`, payload);
        setSuccess("Гурӯҳ бомуваффақият нав карда шуд.");
      } else {
        await api.post("/education/groups/", payload);
        setSuccess("Гурӯҳ бомуваффақият сохта шуд.");
      }

      closeModal();
      await loadData();
    } catch (requestError) {
      setError(
        extractApiError(
          requestError,
          editingGroup ? "Гурӯҳ нав карда нашуд." : "Гурӯҳ сохта нашуд.",
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(event, group) {
    event.stopPropagation();
    if (!window.confirm(`Гурӯҳи «${group.title}» ҳазф шавад?`)) return;

    setDeletingId(group.id);
    setError("");

    try {
      await api.delete(`/education/groups/${group.id}/`);
      setGroups((items) => items.filter((item) => item.id !== group.id));
      setSuccess("Гурӯҳ ҳазф шуд.");
    } catch (requestError) {
      setError(extractApiError(requestError, "Гурӯҳ ҳазф нашуд."));
    } finally {
      setDeletingId(null);
    }
  }

  function openGroup(groupId) {
    navigate(`/groups/${groupId}`);
  }

  return (
    <MainLayout
      title="Гурӯҳҳо"
      description="Курс, филиал, муҳлат, донишҷӯён ва омӯзгорони гурӯҳро идора кунед."
    >
      <div className="resource-page management-page">
        <ResourceAlert type="error" onClose={() => setError("")}>
          {error}
        </ResourceAlert>
        <ResourceAlert type="success" onClose={() => setSuccess("")}>
          {success}
        </ResourceAlert>

        <section className="management-spotlight management-spotlight-green">
          <div>
            <span className="management-eyebrow">GROUP OPERATIONS</span>
            <h2>Гурӯҳҳои таълимӣ дар як марказ</h2>
            <p>
              Гурӯҳ созед, маълумотро нав кунед ва detail-и донишҷӯ, омӯзгор ва
              timetable-ро кушоед.
            </p>
          </div>
          <div className="management-spotlight-metric">
            <strong>{activeGroupsCount}</strong>
            <span>active</span>
          </div>
        </section>

        <section className="resource-kpi-grid resource-kpi-grid-four">
          <article className="resource-kpi-card">
            <span>Ҳамаи гурӯҳҳо</span>
            <strong>{groups.length}</strong>
            <small>ҳамагӣ</small>
          </article>
          <article className="resource-kpi-card">
            <span>Фаъол</span>
            <strong>{activeGroupsCount}</strong>
            <small>active</small>
          </article>
          <article className="resource-kpi-card">
            <span>Донишҷӯён</span>
            <strong>{studentsCount}</strong>
            <small>дар гурӯҳҳо</small>
          </article>
          <article className="resource-kpi-card">
            <span>Омӯзгорон</span>
            <strong>{mentorsCount}</strong>
            <small>{finishedGroupsCount} finished</small>
          </article>
        </section>

        <section className="resource-card management-resource-card">
          <header className="resource-toolbar">
            <div className="resource-search">
              <span>⌕</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Гурӯҳ, курс ё филиал..."
              />
            </div>

            <div className="resource-toolbar-actions">
              <select
                className="resource-select-compact"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="all">Ҳамаи ҳолатҳо</option>
                <option value="active">Active</option>
                <option value="finished">Finished</option>
              </select>

              <button
                type="button"
                className="resource-button resource-button-ghost"
                onClick={loadData}
              >
                Аз нав гирифтан
              </button>

              {canManage && (
                <button
                  type="button"
                  className="resource-button resource-button-primary"
                  onClick={openCreateModal}
                >
                  + Гурӯҳи нав
                </button>
              )}
            </div>
          </header>

          {loading ? (
            <ResourceLoading />
          ) : filteredGroups.length === 0 ? (
            <ResourceEmpty
              title="Гурӯҳ ёфт нашуд"
              description="Филтрро тағйир диҳед ё гурӯҳи нав созед."
              actionLabel={canManage ? "Гурӯҳи нав" : undefined}
              onAction={canManage ? openCreateModal : undefined}
            />
          ) : (
            <div className="resource-table-wrapper">
              <table className="resource-table resource-clickable-table">
                <thead>
                  <tr>
                    <th>Гурӯҳ</th>
                    <th>Курс</th>
                    <th>Филиал</th>
                    <th>Муҳлат</th>
                    <th>Аъзо</th>
                    <th>Ҳолат</th>
                    <th>Амал</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGroups.map((group) => (
                    <tr
                      key={group.id}
                      className="resource-clickable-row"
                      onClick={() => openGroup(group.id)}
                    >
                      <td>
                        <div className="resource-title-cell">
                          <span className="resource-title-icon">▣</span>
                          <div>
                            <strong>{group.title}</strong>
                            <span>#{String(group.id).padStart(3, "0")}</span>
                          </div>
                        </div>
                      </td>
                      <td>{group.course?.title || "—"}</td>
                      <td>{group.branch || "—"}</td>
                      <td>
                        <div className="management-date-range">
                          <span>{formatDate(group.start_date)}</span>
                          <small>→</small>
                          <span>{formatDate(group.end_date)}</span>
                        </div>
                      </td>
                      <td>
                        <div className="management-member-counts">
                          <span>{group.students_count || 0} student</span>
                          <span>{group.mentors_count || 0} mentor</span>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`resource-badge ${
                            group.status === "active"
                              ? "resource-badge-success"
                              : "resource-badge-muted"
                          }`}
                        >
                          {group.status}
                        </span>
                      </td>
                      <td>
                        <div className="resource-row-actions">
                          <button
                            type="button"
                            className="management-view-button"
                            onClick={(event) => {
                              event.stopPropagation();
                              openGroup(group.id);
                            }}
                          >
                            Дидан
                          </button>

                          {canManage && (
                            <>
                              <button
                                type="button"
                                className="management-edit-button"
                                onClick={(event) => openEditModal(event, group)}
                              >
                                ✎
                              </button>
                              <button
                                type="button"
                                className="management-delete-button"
                                onClick={(event) => handleDelete(event, group)}
                                disabled={deletingId === group.id}
                              >
                                {deletingId === group.id ? "…" : "×"}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {canManage && (
        <ResourceModal
          open={modalOpen}
          title={editingGroup ? "Таҳрири гурӯҳ" : "Гурӯҳи нав"}
          description="Курс, сана, филиал ва ҳолати гурӯҳро муайян кунед."
          submitLabel={editingGroup ? "Нав кардани гурӯҳ" : "Сохтани гурӯҳ"}
          loading={saving}
          onClose={closeModal}
          onSubmit={handleSubmit}
        >
          <div className="resource-form-grid management-form-grid">
            <label className="resource-field">
              <span>Номи гурӯҳ</span>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                required
              />
            </label>

            <label className="resource-field">
              <span>Курс</span>
              <select
                name="course_id"
                value={form.course_id}
                onChange={handleChange}
                required
              >
                <option value="">Интихоб кунед</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </label>

            <label className="resource-field resource-field-full">
              <span>Тавсиф</span>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows="4"
                required
              />
            </label>

            <label className="resource-field">
              <span>Санаи оғоз</span>
              <input
                type="date"
                name="start_date"
                value={form.start_date}
                onChange={handleChange}
                required
              />
            </label>

            <label className="resource-field">
              <span>Санаи анҷом</span>
              <input
                type="date"
                name="end_date"
                value={form.end_date}
                onChange={handleChange}
                required
              />
            </label>

            <label className="resource-field">
              <span>Филиал</span>
              <input
                name="branch"
                value={form.branch}
                onChange={handleChange}
                required
              />
            </label>

            <label className="resource-field">
              <span>Ҳолат</span>
              <select name="status" value={form.status} onChange={handleChange}>
                <option value="active">Active</option>
                <option value="finished">Finished</option>
              </select>
            </label>
          </div>
        </ResourceModal>
      )}
    </MainLayout>
  );
}

export default GroupsPage;
