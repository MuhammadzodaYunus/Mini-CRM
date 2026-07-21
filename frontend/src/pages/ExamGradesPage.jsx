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
  group_id: "",
  student_id: "",
  timetable_id: "",
  grade: "",
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

function ExamGradesPage() {
  const { role } = useAuth();
  const canManage = role === "admin" || role === "mentor";

  const [examGrades, setExamGrades] = useState([]);
  const [students, setStudents] = useState([]);
  const [groups, setGroups] = useState([]);
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
      const requests = [api.get("/journal/exam-grades/")];

      if (canManage) {
        requests.push(
          api.get("/accounts/students/"),
          api.get("/education/groups/"),
          api.get("/education/timetables/"),
        );
      }

      const [examResponse, studentsResponse, groupsResponse, timetableResponse] =
        await Promise.all(requests);

      setExamGrades(normalizeList(examResponse.data));
      setStudents(normalizeList(studentsResponse?.data));
      setGroups(normalizeList(groupsResponse?.data));
      setTimetables(
        normalizeList(timetableResponse?.data).filter(
          (item) => item.is_exam === true,
        ),
      );
    } catch (requestError) {
      setError(
        extractApiError(
          requestError,
          "Баҳои имтиҳонӣ гирифта нашуд.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [canManage]);

  const selectedGroupId = Number(form.group_id || 0);

  const availableStudents = useMemo(() => {
    if (!selectedGroupId) {
      return [];
    }

    return students.filter(
      (student) =>
        Number(student.active_group?.group_id) === selectedGroupId,
    );
  }, [selectedGroupId, students]);

  const availableExamTimetables = useMemo(() => {
    if (!selectedGroupId) {
      return [];
    }

    return timetables.filter(
      (item) =>
        item.is_exam === true &&
        Number(item.group?.id) === selectedGroupId,
    );
  }, [selectedGroupId, timetables]);

  const filteredExamGrades = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return examGrades;
    }

    return examGrades.filter((item) =>
      [
        displayUsername(item.student),
        item.group?.title,
        item.group?.course?.title,
        getWeekDayLabel(item.timetable?.week_day),
        item.grade,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [examGrades, search]);

  const averageGrade = useMemo(() => {
    if (!examGrades.length) {
      return "0";
    }

    const total = examGrades.reduce(
      (sum, item) => sum + Number(item.grade || 0),
      0,
    );

    return (total / examGrades.length).toFixed(1);
  }, [examGrades]);

  const highestGrade = useMemo(() => {
    if (!examGrades.length) {
      return 0;
    }

    return Math.max(
      ...examGrades.map((item) => Number(item.grade || 0)),
    );
  }, [examGrades]);

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

    if (name === "group_id") {
      setForm((current) => ({
        ...current,
        group_id: value,
        student_id: "",
        timetable_id: "",
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

    const grade = Number(form.grade);

    if (!Number.isInteger(grade) || grade < 1) {
      setError("Баҳои имтиҳон бояд адади мусбат бошад.");
      return;
    }

    if (!form.group_id || !form.student_id || !form.timetable_id) {
      setError("Гурӯҳ, донишҷӯ ва рӯзи имтиҳонро интихоб кунед.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await api.post("/journal/exam-grades/", {
        student_id: Number(form.student_id),
        group_id: Number(form.group_id),
        timetable_id: Number(form.timetable_id),
        grade,
      });

      setSuccess("Баҳои имтиҳонӣ бомуваффақият сабт шуд.");
      setModalOpen(false);
      setForm(initialForm);
      await loadData();
    } catch (requestError) {
      setError(
        extractApiError(
          requestError,
          "Баҳои имтиҳонӣ сабт нашуд.",
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item) {
    const confirmed = window.confirm(
      `Баҳои имтиҳонии ${displayUsername(item.student)} ҳазф шавад?`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(item.id);
    setError("");
    setSuccess("");

    try {
      await api.delete(`/journal/exam-grades/${item.id}/`);
      setExamGrades((current) =>
        current.filter((grade) => grade.id !== item.id),
      );
      setSuccess("Баҳои имтиҳонӣ ҳазф шуд.");
    } catch (requestError) {
      setError(
        extractApiError(
          requestError,
          "Баҳои имтиҳонӣ ҳазф нашуд.",
        ),
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <MainLayout
      title="Баҳои имтиҳон"
      description="Натиҷаҳои имтиҳонро бо гурӯҳ, донишҷӯ ва рӯзи воқеии имтиҳон пайваст кунед."
    >
      <div className="resource-page journal-page">
        <ResourceAlert type="error" onClose={() => setError("")}>
          {error}
        </ResourceAlert>

        <ResourceAlert type="success" onClose={() => setSuccess("")}>
          {success}
        </ResourceAlert>

        <section className="journal-hero journal-hero-exam">
          <div>
            <span className="journal-eyebrow">EXAM RESULTS</span>
            <h2>Натиҷаҳои имтиҳонӣ</h2>
            <p>
              Мувофиқи модели ҳозира баҳои имтиҳон адади мусбат аст. Танҳо
              timetable-и бо is_exam=true интихоб мешавад.
            </p>
          </div>

          <div className="journal-hero-metric">
            <span>Баҳои миёна</span>
            <strong>{averageGrade}</strong>
            <small>average</small>
          </div>
        </section>

        <section className="journal-stat-grid">
          <article className="journal-stat-card">
            <span>Натиҷаҳо</span>
            <strong>{examGrades.length}</strong>
            <small>ҳамагӣ</small>
          </article>

          <article className="journal-stat-card">
            <span>Баҳои баланд</span>
            <strong>{highestGrade}</strong>
            <small>maximum</small>
          </article>

          <article className="journal-stat-card">
            <span>Рӯзҳои имтиҳон</span>
            <strong>{timetables.length}</strong>
            <small>is_exam=true</small>
          </article>
        </section>

        <section className="resource-card journal-resource-card">
          <header className="resource-toolbar">
            <div className="resource-search">
              <span>⌕</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Донишҷӯ, гурӯҳ, курс ё баҳо..."
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
                  + Баҳои имтиҳонӣ
                </button>
              )}
            </div>
          </header>

          {loading ? (
            <ResourceLoading />
          ) : filteredExamGrades.length === 0 ? (
            <ResourceEmpty
              title="Баҳои имтиҳонӣ нест"
              description="Ҳоло ягон натиҷаи имтиҳонӣ сабт нашудааст."
              actionLabel={canManage ? "Баҳои имтиҳонӣ" : undefined}
              onAction={canManage ? openCreateModal : undefined}
            />
          ) : (
            <div className="resource-table-wrapper">
              <table className="resource-table">
                <thead>
                  <tr>
                    <th>Донишҷӯ</th>
                    <th>Гурӯҳ</th>
                    <th>Курс</th>
                    <th>Рӯзи имтиҳон</th>
                    <th>Вақт</th>
                    <th>Баҳо</th>
                    <th>Сана</th>
                    {canManage && <th aria-label="Амал" />}
                  </tr>
                </thead>

                <tbody>
                  {filteredExamGrades.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="resource-person">
                          <div className="resource-avatar resource-avatar-purple">
                            {displayUsername(item.student)
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>
                            <strong>{displayUsername(item.student)}</strong>
                            <span>Exam grade #{item.id}</span>
                          </div>
                        </div>
                      </td>

                      <td>{item.group?.title || "—"}</td>
                      <td>{item.group?.course?.title || "—"}</td>
                      <td>{getWeekDayLabel(item.timetable?.week_day)}</td>
                      <td>
                        {formatTime(item.timetable?.start_time)} —{" "}
                        {formatTime(item.timetable?.end_time)}
                      </td>
                      <td>
                        <span className="journal-score-badge">{item.grade}</span>
                      </td>
                      <td>{formatDate(item.created_at)}</td>

                      {canManage && (
                        <td>
                          <button
                            type="button"
                            className="resource-icon-button resource-icon-button-danger"
                            onClick={() => handleDelete(item)}
                            disabled={deletingId === item.id}
                            title="Ҳазф кардани баҳо"
                          >
                            {deletingId === item.id ? "…" : "×"}
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
          title="Баҳои имтиҳонӣ"
          description="Аввал гурӯҳ, баъд донишҷӯи фаъол ва рӯзи воқеии имтиҳонро интихоб кунед."
          loading={saving}
          onClose={closeModal}
          onSubmit={handleSubmit}
        >
          <div className="resource-form-grid">
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
                    {group.title} — {group.course?.title || "Курс нест"}
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
                disabled={!form.group_id}
                required
              >
                <option value="">
                  {!form.group_id
                    ? "Аввал гурӯҳро интихоб кунед"
                    : "Донишҷӯро интихоб кунед"}
                </option>

                {availableStudents.map((student) => (
                  <option key={student.id} value={student.id}>
                    {displayUsername(student)}
                  </option>
                ))}
              </select>

              {form.group_id && availableStudents.length === 0 && (
                <small>Дар ин гурӯҳ донишҷӯи фаъол нест.</small>
              )}
            </label>

            <label className="resource-field resource-field-full">
              <span>Рӯзи имтиҳон</span>
              <select
                name="timetable_id"
                value={form.timetable_id}
                onChange={handleChange}
                disabled={!form.group_id}
                required
              >
                <option value="">
                  {!form.group_id
                    ? "Аввал гурӯҳро интихоб кунед"
                    : "Ҷадвали имтиҳонро интихоб кунед"}
                </option>

                {availableExamTimetables.map((item) => (
                  <option key={item.id} value={item.id}>
                    {getWeekDayLabel(item.week_day)} —{" "}
                    {formatTime(item.start_time)} — {formatTime(item.end_time)}
                  </option>
                ))}
              </select>

              {form.group_id && availableExamTimetables.length === 0 && (
                <small>Барои ин гурӯҳ timetable-и имтиҳонӣ нест.</small>
              )}
            </label>

            <label className="resource-field resource-field-full">
              <span>Баҳои имтиҳон</span>
              <input
                type="number"
                min="1"
                step="1"
                name="grade"
                value={form.grade}
                onChange={handleChange}
                placeholder="Масалан: 90"
                required
              />
            </label>
          </div>
        </ResourceModal>
      )}
    </MainLayout>
  );
}

export default ExamGradesPage;
