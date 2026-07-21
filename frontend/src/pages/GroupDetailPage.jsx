import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import api from "../api/axios";
import MainLayout from "../components/layout/MainLayout";
import {
  ResourceAlert,
  ResourceLoading,
} from "../components/ui/ResourceState";
import {
  extractApiError,
  formatDate,
  formatTime,
} from "../utils/data";

import "../styles/detail.css";
import "../styles/group-detail.css";

const weekDayLabels = {
  monday: "Душанбе",
  tuesday: "Сешанбе",
  wednesday: "Чоршанбе",
  thursday: "Панҷшанбе",
  friday: "Ҷумъа",
  saturday: "Шанбе",
  sunday: "Якшанбе",
  Душанбе: "Душанбе",
  Сешанбе: "Сешанбе",
  Чоршанбе: "Чоршанбе",
  Панҷшанбе: "Панҷшанбе",
  Ҷумъа: "Ҷумъа",
  Шанбе: "Шанбе",
  Якшанбе: "Якшанбе",
};

function getWeekDayLabel(value) {
  if (!value) {
    return "—";
  }

  return (
    weekDayLabels[value] ||
    weekDayLabels[String(value).toLowerCase()] ||
    value
  );
}

function getInitials(name) {
  const value = String(name || "?").trim();

  if (!value) {
    return "?";
  }

  return value
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function GroupDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadGroup() {
    setLoading(true);
    setError("");

    try {
      const response = await api.get(
        `/education/groups/${id}/`,
      );

      setGroup(response.data);
    } catch (requestError) {
      setGroup(null);

      setError(
        extractApiError(
          requestError,
          "Маълумоти гурӯҳ гирифта нашуд.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadGroup();
  }, [id]);

  const students = useMemo(() => {
    return Array.isArray(group?.students)
      ? group.students
      : [];
  }, [group]);

  const mentors = useMemo(() => {
    return Array.isArray(group?.mentors)
      ? group.mentors
      : [];
  }, [group]);

  const timetables = useMemo(() => {
    const items = Array.isArray(group?.timetables)
      ? [...group.timetables]
      : [];

    return items.sort((first, second) => {
      return String(
        first.start_time || "",
      ).localeCompare(
        String(second.start_time || ""),
      );
    });
  }, [group]);

  if (loading) {
    return (
      <MainLayout
        title="Маълумоти гурӯҳ"
        description="Маълумоти гурӯҳ гирифта шуда истодааст."
      >
        <ResourceLoading label="Маълумоти гурӯҳ бор шуда истодааст..." />
      </MainLayout>
    );
  }

  if (!group) {
    return (
      <MainLayout
        title="Гурӯҳ ёфт нашуд"
        description="Маълумоти ин гурӯҳ дастрас нест."
      >
        <div className="detail-page">
          <ResourceAlert type="error">
            {error || "Гурӯҳ вуҷуд надорад."}
          </ResourceAlert>

          <button
            type="button"
            className="detail-back-button"
            onClick={() => navigate("/groups")}
          >
            ← Бозгашт ба гурӯҳҳо
          </button>
        </div>
      </MainLayout>
    );
  }

  const studentsCount =
    group.students_count ?? students.length;

  const mentorsCount =
    group.mentors_count ?? mentors.length;

  const examLessonsCount = timetables.filter(
    (timetable) => timetable.is_exam,
  ).length;

  return (
    <MainLayout
      title={group.title}
      description="Курс, донишҷӯён, омӯзгорон ва ҷадвали пурраи гурӯҳ."
    >
      <div className="detail-page">
        <ResourceAlert
          type="error"
          onClose={() => setError("")}
        >
          {error}
        </ResourceAlert>

        <div className="detail-top-actions">
          <button
            type="button"
            className="detail-back-button"
            onClick={() => navigate("/groups")}
          >
            ← Бозгашт ба гурӯҳҳо
          </button>

          <button
            type="button"
            className="detail-refresh-button"
            onClick={loadGroup}
          >
            Навсозӣ
          </button>
        </div>

        <section className="group-detail-hero">
          <div className="group-detail-hero-copy">
            <div className="group-detail-hero-topline">
              <span className="group-detail-code">
                GROUP #
                {String(group.id).padStart(3, "0")}
              </span>

              <span
                className={`group-detail-status group-detail-status-${group.status}`}
              >
                {group.status === "active"
                  ? "Фаъол"
                  : "Анҷомшуда"}
              </span>
            </div>

            <h2>{group.title}</h2>

            <p>
              {group.description ||
                "Барои ин гурӯҳ ҳоло тавсиф навишта нашудааст."}
            </p>

            <div className="group-detail-hero-meta">
              <div>
                <span>Курс</span>

                <strong>
                  {group.course?.title || "—"}
                </strong>
              </div>

              <div>
                <span>Филиал</span>

                <strong>
                  {group.branch || "—"}
                </strong>
              </div>

              <div>
                <span>Давраи таҳсил</span>

                <strong>
                  {formatDate(group.start_date)}
                  {" — "}
                  {formatDate(group.end_date)}
                </strong>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="group-detail-course-card"
            onClick={() => {
              if (group.course?.id) {
                navigate(
                  `/courses/${group.course.id}`,
                );
              }
            }}
            disabled={!group.course?.id}
          >
            <span>Курси вобаста</span>

            <strong>
              {group.course?.title || "Курс нест"}
            </strong>

            <small>
              {group.course?.price
                ? `${Number(
                    group.course.price,
                  ).toLocaleString()} сомонӣ`
                : "Маълумоти курсро кушоед"}
            </small>

            <b>Дидани курс →</b>
          </button>
        </section>

        <section className="group-detail-stat-grid">
          <article className="group-detail-stat-card">
            <div className="group-detail-stat-icon">
              ◉
            </div>

            <div>
              <span>Донишҷӯёни фаъол</span>
              <strong>{studentsCount}</strong>
            </div>
          </article>

          <article className="group-detail-stat-card">
            <div className="group-detail-stat-icon group-detail-stat-icon-purple">
              ◆
            </div>

            <div>
              <span>Омӯзгорон</span>
              <strong>{mentorsCount}</strong>
            </div>
          </article>

          <article className="group-detail-stat-card">
            <div className="group-detail-stat-icon group-detail-stat-icon-green">
              ◷
            </div>

            <div>
              <span>Дарсҳои ҷадвал</span>
              <strong>{timetables.length}</strong>
            </div>
          </article>

          <article className="group-detail-stat-card">
            <div className="group-detail-stat-icon group-detail-stat-icon-warning">
              !
            </div>

            <div>
              <span>Имтиҳонҳо</span>
              <strong>{examLessonsCount}</strong>
            </div>
          </article>
        </section>

        <section className="group-detail-section">
          <header className="group-detail-section-header">
            <div>
              <span>STUDENTS</span>
              <h3>Донишҷӯёни гурӯҳ</h3>

              <p>
                Танҳо донишҷӯёни enrollment-и фаъол
                нишон дода мешаванд.
              </p>
            </div>

            <strong>{students.length} нафар</strong>
          </header>

          {students.length === 0 ? (
            <div className="group-detail-empty">
              <div>◉</div>

              <strong>
                Донишҷӯ вуҷуд надорад
              </strong>

              <p>
                Ба ин гурӯҳ ҳоло донишҷӯи фаъол
                пайваст нашудааст.
              </p>
            </div>
          ) : (
            <div className="group-detail-people-grid">
              {students.map((student) => (
                <article
                  className="group-detail-person-card"
                  key={
                    student.enrollment_id ||
                    student.student_id
                  }
                >
                  <div className="group-detail-person-header">
                    <div className="group-detail-avatar">
                      {getInitials(
                        student.full_name ||
                          student.username,
                      )}
                    </div>

                    <span className="group-detail-person-status">
                      {student.status === "active"
                        ? "Фаъол"
                        : student.status}
                    </span>
                  </div>

                  <span className="group-detail-person-id">
                    STUDENT #
                    {String(
                      student.student_id,
                    ).padStart(3, "0")}
                  </span>

                  <h4>
                    {student.full_name ||
                      student.username}
                  </h4>

                  <p>
                    @{student.username || "—"}
                  </p>

                  <dl className="group-detail-person-info">
                    <div>
                      <dt>Телефон</dt>

                      <dd>
                        {student.phone_number || "—"}
                      </dd>
                    </div>

                    <div>
                      <dt>Санаи таваллуд</dt>

                      <dd>
                        {formatDate(
                          student.birth_date,
                        )}
                      </dd>
                    </div>

                    <div>
                      <dt>Суроға</dt>

                      <dd>
                        {student.address || "—"}
                      </dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="group-detail-section">
          <header className="group-detail-section-header">
            <div>
              <span>MENTORS</span>
              <h3>Омӯзгорони гурӯҳ</h3>

              <p>
                Омӯзгороне, ки ба ҳамин гурӯҳ
                пайваст шудаанд.
              </p>
            </div>

            <strong>{mentors.length} нафар</strong>
          </header>

          {mentors.length === 0 ? (
            <div className="group-detail-empty">
              <div>◆</div>

              <strong>
                Омӯзгор вуҷуд надорад
              </strong>

              <p>
                Ба ин гурӯҳ ҳоло ягон омӯзгор
                пайваст нашудааст.
              </p>
            </div>
          ) : (
            <div className="group-detail-people-grid">
              {mentors.map((mentor) => (
                <article
                  className="group-detail-person-card group-detail-mentor-card"
                  key={
                    mentor.mentor_enrollment_id ||
                    mentor.mentor_id
                  }
                >
                  <div className="group-detail-person-header">
                    <div className="group-detail-avatar group-detail-avatar-purple">
                      {getInitials(
                        mentor.full_name ||
                          mentor.username,
                      )}
                    </div>

                    <span
                      className={`group-detail-level group-detail-level-${mentor.level}`}
                    >
                      {mentor.level || "—"}
                    </span>
                  </div>

                  <span className="group-detail-person-id">
                    MENTOR #
                    {String(
                      mentor.mentor_id,
                    ).padStart(3, "0")}
                  </span>

                  <h4>
                    {mentor.full_name ||
                      mentor.username}
                  </h4>

                  <p>
                    @{mentor.username || "—"}
                  </p>

                  <dl className="group-detail-person-info">
                    <div>
                      <dt>Телефон</dt>

                      <dd>
                        {mentor.phone_number || "—"}
                      </dd>
                    </div>

                    <div>
                      <dt>Дараҷа</dt>

                      <dd>
                        {mentor.level || "—"}
                      </dd>
                    </div>

                    <div>
                      <dt>Enrollment</dt>

                      <dd>
                        #
                        {mentor.mentor_enrollment_id ||
                          "—"}
                      </dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="group-detail-section">
          <header className="group-detail-section-header">
            <div>
              <span>TIMETABLE</span>
              <h3>Ҷадвали дарсии гурӯҳ</h3>

              <p>
                Рӯз, вақти оғоз, вақти анҷом ва
                навъи дарс.
              </p>
            </div>

            <strong>
              {timetables.length} дарс
            </strong>
          </header>

          {timetables.length === 0 ? (
            <div className="group-detail-empty">
              <div>◷</div>

              <strong>
                Ҷадвал вуҷуд надорад
              </strong>

              <p>
                Барои ин гурӯҳ ҳоло ягон вақти
                дарсӣ сохта нашудааст.
              </p>
            </div>
          ) : (
            <div className="group-detail-schedule-grid">
              {timetables.map((timetable) => (
                <article
                  className="group-detail-schedule-card"
                  key={timetable.id}
                >
                  <header>
                    <span>
                      {getWeekDayLabel(
                        timetable.week_day,
                      )}
                    </span>

                    <b
                      className={
                        timetable.is_exam
                          ? "group-detail-exam-badge"
                          : "group-detail-lesson-badge"
                      }
                    >
                      {timetable.is_exam
                        ? "Имтиҳон"
                        : "Дарс"}
                    </b>
                  </header>

                  <div className="group-detail-time">
                    <strong>
                      {formatTime(
                        timetable.start_time,
                      )}
                    </strong>

                    <span>→</span>

                    <strong>
                      {formatTime(
                        timetable.end_time,
                      )}
                    </strong>
                  </div>

                  <footer>
                    <span>
                      TIMETABLE #
                      {String(
                        timetable.id,
                      ).padStart(3, "0")}
                    </span>
                  </footer>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </MainLayout>
  );
}

export default GroupDetailPage;