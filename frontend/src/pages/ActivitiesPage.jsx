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
  displayUsername,
  extractApiError,
  formatDate,
  formatTime,
  normalizeList,
} from "../utils/data";

import "../styles/resources.css";
import "../styles/journal-pages.css";

const initialForm = {
  timetable_id: "",
  student_id: "",
  comment: "",
};

const weekDayLabels = {
  monday: "Душанбе",
  tuesday: "Сешанбе",
  wednesday: "Чоршанбе",
  thursday: "Панҷшанбе",
  friday: "Ҷумъа",
  saturday: "Шанбе",
  sunday: "Якшанбе",
};

function getWeekDayLabel(value) {
  return weekDayLabels[value] || value || "—";
}

function ActivitiesPage() {
  const { role } = useAuth();
  const canManage = role === "admin" || role === "mentor";

  const [activities, setActivities] = useState([]);
  const [students, setStudents] = useState([]);
  const [timetables, setTimetables] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [search, setSearch] = useState("");
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
      const requests = [api.get("/journal/activities/")];

      if (canManage) {
        requests.push(
          api.get("/education/timetables/"),
          api.get("/accounts/students/"),
        );
      }

      const [activitiesResponse, timetablesResponse, studentsResponse] =
        await Promise.all(requests);

      setActivities(normalizeList(activitiesResponse.data));
      setTimetables(normalizeList(timetablesResponse?.data));
      setStudents(normalizeList(studentsResponse?.data));
    } catch (requestError) {
      setError(
        extractApiError(
          requestError,
          "Маълумоти фаъолиятҳо гирифта нашуд.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [canManage]);

  const selectedTimetable = useMemo(() => {
    return timetables.find(
      (item) => Number(item.id) === Number(form.timetable_id),
    );
  }, [form.timetable_id, timetables]);

  const availableStudents = useMemo(() => {
    const groupId = Number(selectedTimetable?.group?.id || 0);

    if (!groupId) {
      return [];
    }

    return students.filter(
      (student) => Number(student.active_group?.group_id) === groupId,
    );
  }, [selectedTimetable, students]);

  const filteredActivities = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return activities;
    }

    return activities.filter((activity) =>
      [
        displayUsername(activity.student),
        activity.timetable?.group?.title,
        activity.timetable?.group?.course?.title,
        activity.comment,
        getWeekDayLabel(activity.timetable?.week_day),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [activities, search]);

  const uniqueStudentsCount = useMemo(() => {
    return new Set(
      activities
        .map((activity) => activity.student?.id)
        .filter(Boolean),
    ).size;
  }, [activities]);

  const uniqueGroupsCount = useMemo(() => {
    return new Set(
      activities
        .map((activity) => activity.timetable?.group?.id)
        .filter(Boolean),
    ).size;
  }, [activities]);

  function openCreateModal() {
    setForm(initialForm);
    setError("");
    setSuccess("");
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) {
      return;
    }

    setModalOpen(false);
    setForm(initialForm);
  }

  function handleChange(event) {
    const { name, value } = event.target;

    if (name === "timetable_id") {
      setForm((current) => ({
        ...current,
        timetable_id: value,
        student_id: "",
      }));
      return;
    }

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.timetable_id || !form.student_id) {
      setError("Ҷадвал ва донишҷӯро интихоб кунед.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await api.post("/journal/activities/", {
        student_id: Number(form.student_id),
        timetable_id: Number(form.timetable_id),
        comment: form.comment.trim(),
      });

      setSuccess("Фаъолият бомуваффақият сабт шуд.");
      setModalOpen(false);
      setForm(initialForm);
      await loadData();
    } catch (requestError) {
      setError(
        extractApiError(
          requestError,
          "Фаъолият сабт нашуд.",
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(activity) {
    const confirmed = window.confirm(
      `Сабти фаъолияти ${displayUsername(activity.student)} ҳазф шавад?`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(activity.id);
    setError("");
    setSuccess("");

    try {
      await api.delete(`/journal/activities/${activity.id}/`);
      setActivities((current) =>
        current.filter((item) => item.id !== activity.id),
      );
      setSuccess("Фаъолият ҳазф шуд.");
    } catch (requestError) {
      setError(
        extractApiError(
          requestError,
          "Фаъолият ҳазф нашуд.",
        ),
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <MainLayout
      title="Фаъолиятҳо"
      description="Иштирок ва шарҳи донишҷӯёнро аз рӯйи ҷадвали воқеии гурӯҳ сабт кунед."
    >
      <div className="resource-page journal-page">
        <ResourceAlert type="error" onClose={() => setError("")}>
          {error}
        </ResourceAlert>

        <ResourceAlert type="success" onClose={() => setSuccess("")}>
          {success}
        </ResourceAlert>

        <section className="journal-hero journal-hero-activity">
          <div>
            <span className="journal-eyebrow">ACTIVITY JOURNAL</span>
            <h2>Назорати иштироки донишҷӯён</h2>
            <p>
              Аввал ҷадвали дарсро интихоб кунед. Баъд танҳо донишҷӯёни фаъоли
              ҳамон гурӯҳ нишон дода мешаванд.
            </p>
          </div>

          <div className="journal-hero-metric">
            <span>Ҳамаи сабтҳо</span>
            <strong>{activities.length}</strong>
            <small>activity</small>
          </div>
        </section>

        <section className="journal-stat-grid">
          <article className="journal-stat-card">
            <span>Сабтҳо</span>
            <strong>{activities.length}</strong>
            <small>ҳамагӣ</small>
          </article>

          <article className="journal-stat-card">
            <span>Донишҷӯён</span>
            <strong>{uniqueStudentsCount}</strong>
            <small>нафар</small>
          </article>

          <article className="journal-stat-card">
            <span>Гурӯҳҳо</span>
            <strong>{uniqueGroupsCount}</strong>
            <small>гурӯҳ</small>
          </article>
        </section>

        <section className="resource-card journal-resource-card">
          <header className="resource-toolbar">
            <div className="resource-search">
              <span>⌕</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Донишҷӯ, гурӯҳ, рӯз ё шарҳ..."
              />
            </div>

            <div className="resource-toolbar-actions">
              <button
                type="button"
                className="resource-button resource-button-ghost"
                onClick={loadData}
                disabled={loading}
              >
                Навсозӣ
              </button>

              {canManage && (
                <button
                  type="button"
                  className="resource-button resource-button-primary"
                  onClick={openCreateModal}
                >
                  + Фаъолияти нав
                </button>
              )}
            </div>
          </header>

          {loading ? (
            <ResourceLoading />
          ) : filteredActivities.length === 0 ? (
            <ResourceEmpty
              title="Фаъолият нест"
              description="Ҳоло ягон сабти фаъолият вуҷуд надорад."
              actionLabel={canManage ? "Фаъолияти нав" : undefined}
              onAction={canManage ? openCreateModal : undefined}
            />
          ) : (
            <div className="resource-table-wrapper">
              <table className="resource-table">
                <thead>
                  <tr>
                    <th>Донишҷӯ</th>
                    <th>Гурӯҳ</th>
                    <th>Рӯз</th>
                    <th>Вақт</th>
                    <th>Шарҳ</th>
                    <th>Сана</th>
                    {canManage && <th aria-label="Амал" />}
                  </tr>
                </thead>

                <tbody>
                  {filteredActivities.map((activity) => (
                    <tr key={activity.id}>
                      <td>
                        <div className="resource-person">
                          <div className="resource-avatar">
                            {displayUsername(activity.student)
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>
                            <strong>{displayUsername(activity.student)}</strong>
                            <span>Activity #{activity.id}</span>
                          </div>
                        </div>
                      </td>

                      <td>{activity.timetable?.group?.title || "—"}</td>
                      <td>{getWeekDayLabel(activity.timetable?.week_day)}</td>
                      <td>
                        {formatTime(activity.timetable?.start_time)} —{" "}
                        {formatTime(activity.timetable?.end_time)}
                      </td>
                      <td>{activity.comment || "—"}</td>
                      <td>{formatDate(activity.created_at)}</td>

                      {canManage && (
                        <td>
                          <button
                            type="button"
                            className="resource-icon-button resource-icon-button-danger"
                            onClick={() => handleDelete(activity)}
                            disabled={deletingId === activity.id}
                            title="Ҳазф кардани фаъолият"
                          >
                            {deletingId === activity.id ? "…" : "×"}
                          </button>
                        </td>
                      )}
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
          title="Фаъолияти нав"
          description="Ҷадвалро интихоб кунед; баъд донишҷӯёни фаъоли гурӯҳи он пайдо мешаванд."
          loading={saving}
          onClose={closeModal}
          onSubmit={handleSubmit}
        >
          <div className="resource-form-grid">
            <label className="resource-field resource-field-full">
              <span>Ҷадвали дарс</span>
              <select
                name="timetable_id"
                value={form.timetable_id}
                onChange={handleChange}
                required
              >
                <option value="">Интихоб кунед</option>
                {timetables.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.group?.title || "Гурӯҳ нест"} —{" "}
                    {getWeekDayLabel(item.week_day)} —{" "}
                    {formatTime(item.start_time)}
                  </option>
                ))}
              </select>
            </label>

            <label className="resource-field resource-field-full">
              <span>Донишҷӯ</span>
              <select
                name="student_id"
                value={form.student_id}
                onChange={handleChange}
                disabled={!form.timetable_id}
                required
              >
                <option value="">
                  {!form.timetable_id
                    ? "Аввал ҷадвалро интихоб кунед"
                    : "Донишҷӯро интихоб кунед"}
                </option>

                {availableStudents.map((student) => (
                  <option key={student.id} value={student.id}>
                    {displayUsername(student)}
                  </option>
                ))}
              </select>

              {form.timetable_id && availableStudents.length === 0 && (
                <small>Дар гурӯҳи ин ҷадвал донишҷӯи фаъол нест.</small>
              )}
            </label>

            <label className="resource-field resource-field-full">
              <span>Шарҳ</span>
              <textarea
                name="comment"
                value={form.comment}
                onChange={handleChange}
                rows="4"
                placeholder="Масалан: Дар дарс фаъолона иштирок кард"
              />
            </label>
          </div>
        </ResourceModal>
      )}
    </MainLayout>
  );
}

export default ActivitiesPage;
