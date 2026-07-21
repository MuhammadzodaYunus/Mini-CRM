import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import api from "../api/axios";
import MainLayout from "../components/layout/MainLayout";
import { useAuth } from "../context/AuthContext";
import { normalizeList } from "../utils/data";
import "../styles/dashboard.css";

const roleDescriptions = {
  admin: "Ҳолати умумии маркази таълимиро аз ҳамин ҷо идора кунед.",
  mentor: "Гурӯҳҳо, донишҷӯён ва журналҳои вобаста ба шуморо бинед.",
  student: "Курс, гурӯҳ, ҷадвал ва натиҷаҳои шахсии худро бинед.",
};

const shortDayLabels = ["Як", "Дш", "Сш", "Чш", "Пш", "Ҷм", "Шн"];

function buildWeeklyChart(...collections) {
  const today = new Date();
  const days = [];

  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setHours(0, 0, 0, 0);
    date.setDate(today.getDate() - offset);

    const key = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-");

    days.push({
      date,
      key,
      label: shortDayLabels[date.getDay()],
      count: 0,
    });
  }

  collections.flat().forEach((item) => {
    if (!item?.created_at) {
      return;
    }

    const itemDate = new Date(item.created_at);

    if (Number.isNaN(itemDate.getTime())) {
      return;
    }

    const localKey = [
      itemDate.getFullYear(),
      String(itemDate.getMonth() + 1).padStart(2, "0"),
      String(itemDate.getDate()).padStart(2, "0"),
    ].join("-");

    const day = days.find((candidate) => candidate.key === localKey);

    if (day) {
      day.count += 1;
    }
  });

  const maximum = Math.max(...days.map((day) => day.count), 1);

  return days.map((day) => ({
    ...day,
    height: day.count === 0 ? 4 : Math.max(14, (day.count / maximum) * 100),
  }));
}

function DashboardPage() {
  const { currentUser, role } = useAuth();
  const [data, setData] = useState({
    students: [],
    mentors: [],
    courses: [],
    groups: [],
    timetables: [],
    activities: [],
    grades: [],
    examGrades: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      setError("");

      try {
        const requests = [
          api.get("/education/courses/"),
          api.get("/education/groups/"),
          api.get("/education/timetables/"),
          api.get("/journal/activities/"),
          api.get("/journal/grades/"),
          api.get("/journal/exam-grades/"),
        ];

        if (role !== "student") {
          requests.push(api.get("/accounts/students/"));
        }

        if (role !== "mentor") {
          requests.push(api.get("/accounts/mentors/"));
        }

        const responses = await Promise.all(requests);
        const [
          coursesResponse,
          groupsResponse,
          timetablesResponse,
          activitiesResponse,
          gradesResponse,
          examGradesResponse,
          seventhResponse,
          eighthResponse,
        ] = responses;

        let students = [];
        let mentors = [];

        if (role === "admin") {
          students = normalizeList(seventhResponse?.data);
          mentors = normalizeList(eighthResponse?.data);
        } else if (role === "mentor") {
          students = normalizeList(seventhResponse?.data);
        } else if (role === "student") {
          mentors = normalizeList(seventhResponse?.data);
        }

        setData({
          students,
          mentors,
          courses: normalizeList(coursesResponse.data),
          groups: normalizeList(groupsResponse.data),
          timetables: normalizeList(timetablesResponse.data),
          activities: normalizeList(activitiesResponse.data),
          grades: normalizeList(gradesResponse.data),
          examGrades: normalizeList(examGradesResponse.data),
        });
      } catch (requestError) {
        setError(
          requestError.response?.data?.detail ||
            "Маълумоти dashboard гирифта нашуд.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [role]);

  const statistics = useMemo(() => {
    if (role === "mentor") {
      return [
        {
          title: "Донишҷӯён",
          value: data.students.length,
          description: "Донишҷӯёни гурӯҳҳои шумо",
          icon: "◉",
        },
        {
          title: "Гурӯҳҳо",
          value: data.groups.length,
          description: "Гурӯҳҳои ба шумо вобаста",
          icon: "▣",
        },
        {
          title: "Ҷадвал",
          value: data.timetables.length,
          description: "Рӯзҳои дарсии шумо",
          icon: "◷",
        },
        {
          title: "Баҳоҳо",
          value: data.grades.length + data.examGrades.length,
          description: "Баҳоҳои сабтшуда",
          icon: "☆",
        },
      ];
    }

    if (role === "student") {
      return [
        {
          title: "Курс",
          value: data.courses.length,
          description: "Курси фаъоли шумо",
          icon: "▤",
        },
        {
          title: "Гурӯҳ",
          value: data.groups.length,
          description: "Гурӯҳи фаъоли шумо",
          icon: "▣",
        },
        {
          title: "Дарсҳо",
          value: data.timetables.length,
          description: "Рӯзҳои ҷадвали шумо",
          icon: "◷",
        },
        {
          title: "Натиҷаҳо",
          value: data.grades.length + data.examGrades.length,
          description: "Баҳои одӣ ва имтиҳонӣ",
          icon: "☆",
        },
      ];
    }

    return [
      {
        title: "Донишҷӯён",
        value: data.students.length,
        description: "Шумораи умумии донишҷӯён",
        icon: "◉",
      },
      {
        title: "Омӯзгорон",
        value: data.mentors.length,
        description: "Омӯзгорони марказ",
        icon: "◇",
      },
      {
        title: "Курсҳо",
        value: data.courses.length,
        description: "Курсҳои таълимӣ",
        icon: "▤",
      },
      {
        title: "Гурӯҳҳо",
        value: data.groups.length,
        description: "Гурӯҳҳои марказ",
        icon: "▣",
      },
    ];
  }, [data, role]);

  const quickActions = useMemo(() => {
    if (role === "admin") {
      return [
        ["/students", "Донишҷӯи нав", "Профили донишҷӯ созед"],
        ["/mentors", "Омӯзгори нав", "Профили омӯзгор созед"],
        ["/courses", "Курси нав", "Курси таълимӣ илова кунед"],
        ["/groups", "Гурӯҳи нав", "Гурӯҳи таълимӣ созед"],
      ];
    }

    if (role === "mentor") {
      return [
        ["/activities", "Фаъолият", "Иштирокро сабт кунед"],
        ["/grades", "Баҳо", "Баҳои одӣ гузоред"],
        ["/exam-grades", "Имтиҳон", "Баҳои имтиҳонӣ гузоред"],
        ["/profile", "Профили ман", "Гурӯҳҳои худро бинед"],
      ];
    }

    return [
      ["/profile", "Профили ман", "Маълумоти шахсиро бинед"],
      ["/groups", "Гурӯҳи ман", "Маълумоти гурӯҳро бинед"],
      ["/timetables", "Ҷадвали ман", "Рӯзҳои дарсро бинед"],
      ["/grades", "Натиҷаҳои ман", "Баҳоҳоро бинед"],
    ];
  }, [role]);

  const chartValues = useMemo(
    () => buildWeeklyChart(data.activities, data.grades, data.examGrades),
    [data.activities, data.examGrades, data.grades],
  );

  const weeklyTotal = chartValues.reduce((sum, day) => sum + day.count, 0);
  const profile = currentUser?.profile;

  return (
    <MainLayout
      title={role === "admin" ? "Dashboard" : "Панели шахсӣ"}
      description={roleDescriptions[role]}
    >
      <div className="dashboard-content">
        {error && <div className="dashboard-error">{error}</div>}

        <section className="statistics-grid">
          {statistics.map((item) => (
            <article className="statistic-card" key={item.title}>
              <div className="statistic-card-top">
                <div className="statistic-icon">{item.icon}</div>
                <span className="statistic-status">
                  {loading ? "..." : "Live"}
                </span>
              </div>

              <strong className="statistic-value">
                {loading ? "—" : item.value}
              </strong>
              <h2>{item.title}</h2>
              <p>{item.description}</p>
            </article>
          ))}
        </section>

        <section className="dashboard-content-grid">
          <article className="dashboard-panel overview-panel">
            <div className="panel-header">
              <div>
                <p className="panel-label">WEEKLY OVERVIEW</p>
                <h2>
                  {role === "student"
                    ? "Фаъолияти шахсӣ"
                    : "Фаъолияти ҳафтаина"}
                </h2>
              </div>

              <span className="secondary-button">
                {loading ? "..." : `${weeklyTotal} сабт`}
              </span>
            </div>

            <div className="activity-chart">
              <div className="chart-y-axis">
                <span>Max</span>
                <span>75%</span>
                <span>50%</span>
                <span>25%</span>
                <span>0</span>
              </div>

              <div className="chart-main">
                <div className="chart-grid-lines">
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                </div>

                <div className="chart-bars">
                  {chartValues.map((item) => (
                    <div className="chart-column" key={item.key}>
                      <div
                        className="chart-bar"
                        style={{ height: `${item.height}%` }}
                      >
                        <span className="chart-tooltip">{item.count}</span>
                      </div>
                      <span className="chart-label">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </article>

          <article className="dashboard-panel quick-actions-panel">
            <div className="panel-header">
              <div>
                <p className="panel-label">QUICK ACTIONS</p>
                <h2>Амалҳои зуд</h2>
              </div>
            </div>

            <div className="quick-actions">
              {quickActions.map(([path, title, description]) => (
                <Link to={path} className="quick-action" key={path}>
                  <span>→</span>
                  <div>
                    <strong>{title}</strong>
                    <p>{description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </article>
        </section>

        <section className="dashboard-bottom-grid">
          <article className="dashboard-panel recent-panel">
            <div className="panel-header">
              <div>
                <p className="panel-label">ACCOUNT OVERVIEW</p>
                <h2>Маълумоти ҳисоб</h2>
              </div>
              <Link to="/profile" className="secondary-button">
                Профил
              </Link>
            </div>

            <div className="recent-list">
              <div className="recent-item">
                <div className="recent-number">01</div>
                <div className="recent-content">
                  <strong>{currentUser?.user?.username}</strong>
                  <p>{currentUser?.user?.email || "Email ворид нашудааст"}</p>
                </div>
                <span className="recent-time">{role}</span>
              </div>

              {role === "student" && (
                <div className="recent-item">
                  <div className="recent-number">02</div>
                  <div className="recent-content">
                    <strong>
                      {profile?.active_group?.group_title ||
                        "Гурӯҳи фаъол нест"}
                    </strong>
                    <p>
                      {profile?.active_group?.course_title ||
                        "Курси фаъол нест"}
                    </p>
                  </div>
                  <span className="recent-time">
                    {profile?.active_group?.branch || "—"}
                  </span>
                </div>
              )}

              {role === "mentor" && (
                <div className="recent-item">
                  <div className="recent-number">02</div>
                  <div className="recent-content">
                    <strong>Гурӯҳҳои вобаста</strong>
                    <p>
                      {profile?.groups
                        ?.map((group) => group.group_title)
                        .join(", ") || "Ҳоло гурӯҳ нест"}
                    </p>
                  </div>
                  <span className="recent-time">
                    {profile?.level || "—"}
                  </span>
                </div>
              )}
            </div>
          </article>

          <article className="dashboard-panel system-panel">
            <div className="panel-header">
              <div>
                <p className="panel-label">SYSTEM STATUS</p>
                <h2>Ҳолати система</h2>
              </div>
            </div>

            <div className="system-status-list">
              <div className="system-status-item">
                <div>
                  <strong>Django API</strong>
                  <span>Backend server</span>
                </div>
                <span className="status-badge status-online">Online</span>
              </div>

              <div className="system-status-item">
                <div>
                  <strong>JWT</strong>
                  <span>Access ва refresh token</span>
                </div>
                <span className="status-badge status-online">Active</span>
              </div>

              <div className="system-status-item">
                <div>
                  <strong>Role access</strong>
                  <span>Admin, mentor ва student</span>
                </div>
                <span className="status-badge status-online">{role}</span>
              </div>
            </div>
          </article>
        </section>
      </div>
    </MainLayout>
  );
}

export default DashboardPage;
