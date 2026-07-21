import { NavLink, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import "../../styles/layout.css";

const menuItems = [
  {
    path: "/dashboard",
    label: "Dashboard",
    icon: "▦",
    roles: ["admin", "mentor", "student"],
  },
  {
    path: "/profile",
    label: "Профили ман",
    icon: "◎",
    roles: ["admin", "mentor", "student"],
  },
  {
    path: "/students",
    label: "Донишҷӯён",
    icon: "◉",
    roles: ["admin", "mentor"],
  },
  {
    path: "/mentors",
    label: "Омӯзгорон",
    icon: "◇",
    roles: ["admin", "student"],
  },
  {
    path: "/courses",
    label: "Курсҳо",
    icon: "▤",
    roles: ["admin", "mentor", "student"],
  },
  {
    path: "/groups",
    label: "Гурӯҳҳо",
    icon: "▣",
    roles: ["admin", "mentor", "student"],
  },
  {
    path: "/timetables",
    label: "Ҷадвали дарсӣ",
    icon: "◷",
    roles: ["admin", "mentor", "student"],
  },
  {
    path: "/student-enrollments",
    label: "Қабули донишҷӯ",
    icon: "↳",
    roles: ["admin"],
  },
  {
    path: "/mentor-enrollments",
    label: "Қабули омӯзгор",
    icon: "⌁",
    roles: ["admin"],
  },
  {
    path: "/activities",
    label: "Фаъолиятҳо",
    icon: "✓",
    roles: ["admin", "mentor", "student"],
  },
  {
    path: "/grades",
    label: "Баҳоҳо",
    icon: "☆",
    roles: ["admin", "mentor", "student"],
  },
  {
    path: "/exam-grades",
    label: "Баҳои имтиҳон",
    icon: "◆",
    roles: ["admin", "mentor", "student"],
  },
];

const roleLabels = {
  admin: "Administrator",
  mentor: "Омӯзгор",
  student: "Донишҷӯ",
};

function Sidebar() {
  const navigate = useNavigate();
  const { currentUser, role, logout } = useAuth();
  const username = currentUser?.user?.username || "User";

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  const visibleItems = menuItems.filter((item) =>
    item.roles.includes(role),
  );

  return (
    <aside className="main-sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-logo">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M3 7.5 12 3l9 4.5-9 4.5-9-4.5Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />

            <path
              d="M6 10v5.2c0 1.8 2.7 3.3 6 3.3s6-1.5 6-3.3V10"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <div className="sidebar-brand-text">
          <strong>EDUCATION</strong>
          <span>MANAGEMENT SYSTEM</span>
        </div>
      </div>

      <nav className="sidebar-menu">
        <p className="sidebar-section-title">МЕНЮИ АСОСӢ</p>

        {visibleItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              isActive
                ? "sidebar-menu-item sidebar-menu-item-active"
                : "sidebar-menu-item"
            }
          >
            <span className="sidebar-menu-icon">{item.icon}</span>
            <span className="sidebar-menu-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-account">
        <button
          type="button"
          className="sidebar-profile-button"
          onClick={() => navigate("/profile")}
          title="Профили ман"
        >
          <div className="sidebar-account-avatar">
            {username.charAt(0).toUpperCase()}
          </div>

          <div className="sidebar-account-info">
            <strong>{username}</strong>
            <span>{roleLabels[role] || "User"}</span>
          </div>
        </button>

        <button
          type="button"
          className="sidebar-logout-button"
          onClick={handleLogout}
          title="Баромадан"
        >
          ↪
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
