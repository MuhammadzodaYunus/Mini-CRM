import { useEffect, useMemo, useState } from "react";

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
  formatTime,
  normalizeList,
} from "../utils/data";

import "../styles/resources.css";
import "../styles/management.css";

const weekDayLabels = {
  monday: "Душанбе",
  tuesday: "Сешанбе",
  wednesday: "Чоршанбе",
  thursday: "Панҷшанбе",
  friday: "Ҷумъа",
  saturday: "Шанбе",
  sunday: "Якшанбе",
};

const initialForm = {
  group_id: "",
  start_time: "",
  end_time: "",
  week_day: "monday",
  is_exam: false,
};

function TimetablesPage() {
  const { role } = useAuth();
  const canManage = role === "admin";

  const [timetables, setTimetables] = useState([]);
  const [groups, setGroups] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingItem, setEditingItem] = useState(null);
  const [search, setSearch] = useState("");
  const [dayFilter, setDayFilter] = useState("all");
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
      const [timetablesResponse, groupsResponse] = await Promise.all([
        api.get("/education/timetables/"),
        api.get("/education/groups/"),
      ]);
      setTimetables(normalizeList(timetablesResponse.data));
      setGroups(normalizeList(groupsResponse.data));
    } catch (requestError) {
      setError(
        extractApiError(requestError, "Ҷадвали дарсӣ гирифта нашуд."),
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredTimetables = useMemo(() => {
    const query = search.trim().toLowerCase();

    return timetables.filter((item) => {
      if (dayFilter !== "all" && item.week_day !== dayFilter) return false;
      if (!query) return true;

      return [
        item.id,
        item.group?.title,
        item.group?.course?.title,
        item.week_day,
        item.start_time,
        item.end_time,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [dayFilter, search, timetables]);

  const examCount = timetables.filter((item) => item.is_exam).length;
  const groupsCount = new Set(
    timetables.map((item) => item.group?.id).filter(Boolean),
  ).size;

  function handleChange(event) {
    const { name, type, checked, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function openCreateModal() {
    setEditingItem(null);
    setForm(initialForm);
    setModalOpen(true);
    setError("");
  }

  function openEditModal(item) {
    setEditingItem(item);
    setForm({
      group_id: String(item.group?.id || ""),
      start_time: String(item.start_time || "").slice(0, 5),
      end_time: String(item.end_time || "").slice(0, 5),
      week_day: item.week_day || "monday",
      is_exam: Boolean(item.is_exam),
    });
    setModalOpen(true);
    setError("");
  }

  function closeModal() {
    if (saving) return;
    setModalOpen(false);
    setEditingItem(null);
    setForm(initialForm);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    const payload = {
      group_id: Number(form.group_id),
      start_time: form.start_time,
      end_time: form.end_time,
      week_day: form.week_day,
      is_exam: form.is_exam,
    };

    try {
      if (editingItem) {
        await api.patch(`/education/timetables/${editingItem.id}/`, payload);
        setSuccess("Ҷадвали дарсӣ нав карда шуд.");
      } else {
        await api.post("/education/timetables/", payload);
        setSuccess("Ҷадвали дарсӣ сохта шуд.");
      }

      closeModal();
      await loadData();
    } catch (requestError) {
      setError(
        extractApiError(
          requestError,
          editingItem
            ? "Ҷадвали дарсӣ нав карда нашуд."
            : "Ҷадвали дарсӣ сохта нашуд.",
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item) {
    if (!window.confirm(`Ҷадвали ${item.group?.title || item.id} ҳазф шавад?`)) {
      return;
    }

    setDeletingId(item.id);
    setError("");

    try {
      await api.delete(`/education/timetables/${item.id}/`);
      setTimetables((items) => items.filter((current) => current.id !== item.id));
      setSuccess("Ҷадвали дарсӣ ҳазф шуд.");
    } catch (requestError) {
      setError(
        extractApiError(requestError, "Ҷадвали дарсӣ ҳазф нашуд."),
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <MainLayout
      title="Ҷадвали дарсӣ"
      description="Рӯз, вақт, гурӯҳ ва рӯзи имтиҳонро идора кунед."
    >
      <div className="resource-page management-page">
        <ResourceAlert type="error" onClose={() => setError("")}>
          {error}
        </ResourceAlert>
        <ResourceAlert type="success" onClose={() => setSuccess("")}>
          {success}
        </ResourceAlert>

        <section className="management-spotlight management-spotlight-purple">
          <div>
            <span className="management-eyebrow">WEEKLY SCHEDULE</span>
            <h2>Ҷадвали дақиқи дарс ва имтиҳон</h2>
            <p>
              Ҳар timetable-ро созед, таҳрир кунед ва ба гурӯҳи дуруст пайваст
              намоед.
            </p>
          </div>
          <div className="management-spotlight-metric">
            <strong>{timetables.length}</strong>
            <span>вақт</span>
          </div>
        </section>

        <section className="resource-kpi-grid resource-kpi-grid-four">
          <article className="resource-kpi-card">
            <span>Ҳамаи вақтҳо</span>
            <strong>{timetables.length}</strong>
            <small>ҳамагӣ</small>
          </article>
          <article className="resource-kpi-card">
            <span>Гурӯҳҳо</span>
            <strong>{groupsCount}</strong>
            <small>бо ҷадвал</small>
          </article>
          <article className="resource-kpi-card">
            <span>Имтиҳон</span>
            <strong>{examCount}</strong>
            <small>exam day</small>
          </article>
          <article className="resource-kpi-card">
            <span>Дарс</span>
            <strong>{timetables.length - examCount}</strong>
            <small>lesson</small>
          </article>
        </section>

        <section className="resource-card management-resource-card">
          <header className="resource-toolbar">
            <div className="resource-search">
              <span>⌕</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Гурӯҳ, курс ё вақт..."
              />
            </div>
            <div className="resource-toolbar-actions">
              <select
                className="resource-select-compact"
                value={dayFilter}
                onChange={(event) => setDayFilter(event.target.value)}
              >
                <option value="all">Ҳамаи рӯзҳо</option>
                {Object.entries(weekDayLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
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
                  + Вақти нав
                </button>
              )}
            </div>
          </header>

          {loading ? (
            <ResourceLoading />
          ) : filteredTimetables.length === 0 ? (
            <ResourceEmpty
              title="Ҷадвал ёфт нашуд"
              description="Барои гурӯҳ рӯзи нави дарсӣ созед."
              actionLabel={canManage ? "Вақти нав" : undefined}
              onAction={canManage ? openCreateModal : undefined}
            />
          ) : (
            <div className="management-schedule-grid">
              {filteredTimetables.map((item) => (
                <article className="management-schedule-card" key={item.id}>
                  <header>
                    <div>
                      <span className="management-id-label">
                        TIMETABLE #{String(item.id).padStart(3, "0")}
                      </span>
                      <h3>{weekDayLabels[item.week_day] || item.week_day}</h3>
                    </div>
                    <span
                      className={`resource-badge ${
                        item.is_exam
                          ? "resource-badge-warning"
                          : "resource-badge-info"
                      }`}
                    >
                      {item.is_exam ? "Exam" : "Lesson"}
                    </span>
                  </header>

                  <div className="management-schedule-time">
                    <strong>{formatTime(item.start_time)}</strong>
                    <span>→</span>
                    <strong>{formatTime(item.end_time)}</strong>
                  </div>

                  <div className="management-schedule-group">
                    <span>▣</span>
                    <div>
                      <strong>{item.group?.title || "Гурӯҳ нест"}</strong>
                      <small>{item.group?.course?.title || "Курс нест"}</small>
                    </div>
                  </div>

                  {canManage && (
                    <footer className="management-card-actions">
                      <button
                        type="button"
                        className="management-edit-button"
                        onClick={() => openEditModal(item)}
                      >
                        ✎ Таҳрир
                      </button>
                      <button
                        type="button"
                        className="management-delete-button"
                        onClick={() => handleDelete(item)}
                        disabled={deletingId === item.id}
                      >
                        {deletingId === item.id ? "…" : "×"}
                      </button>
                    </footer>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      {canManage && (
        <ResourceModal
          open={modalOpen}
          title={editingItem ? "Таҳрири ҷадвал" : "Вақти нави дарсӣ"}
          description="Гурӯҳ, рӯз ва вақти дарсро муайян кунед."
          submitLabel={editingItem ? "Нав кардани ҷадвал" : "Сохтани ҷадвал"}
          loading={saving}
          onClose={closeModal}
          onSubmit={handleSubmit}
        >
          <div className="resource-form-grid management-form-grid">
            <label className="resource-field resource-field-full">
              <span>Гурӯҳ</span>
              <select
                name="group_id"
                value={form.group_id}
                onChange={handleChange}
                required
              >
                <option value="">Интихоб кунед</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.title} — {group.course?.title}
                  </option>
                ))}
              </select>
            </label>

            <label className="resource-field">
              <span>Вақти оғоз</span>
              <input
                type="time"
                name="start_time"
                value={form.start_time}
                onChange={handleChange}
                required
              />
            </label>

            <label className="resource-field">
              <span>Вақти анҷом</span>
              <input
                type="time"
                name="end_time"
                value={form.end_time}
                onChange={handleChange}
                required
              />
            </label>

            <label className="resource-field resource-field-full">
              <span>Рӯзи ҳафта</span>
              <select
                name="week_day"
                value={form.week_day}
                onChange={handleChange}
              >
                {Object.entries(weekDayLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="resource-checkbox resource-field-full">
              <input
                type="checkbox"
                name="is_exam"
                checked={form.is_exam}
                onChange={handleChange}
              />
              <span className="resource-checkbox-control" />
              <div>
                <strong>Рӯзи имтиҳон</strong>
                <small>Барои ExamGrade истифода мешавад.</small>
              </div>
            </label>
          </div>
        </ResourceModal>
      )}
    </MainLayout>
  );
}

export default TimetablesPage;
