import { useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import ThemeToggle from "../ui/ThemeToggle";
import "../../styles/layout.css";

const roleLabels = {
  admin: "Administrator",
  mentor: "Омӯзгор",
  student: "Донишҷӯ",
  user: "User",
};

function Header({ title, description }) {
  const navigate = useNavigate();
  const { currentUser, role } = useAuth();
  const username = currentUser?.user?.username || "User";

  return (
    <header className="main-header">
      <div className="main-header-content">
        <span className="main-header-label">
          ПАНЕЛИ ИДОРАКУНӢ
        </span>

        <h1>{title}</h1>

        {description && (
          <p className="main-header-description">
            {description}
          </p>
        )}
      </div>

      <div className="main-header-actions">
        <ThemeToggle />

        <button
          type="button"
          className="header-user header-user-button"
          onClick={() => navigate("/profile")}
          title="Профили ман"
        >
          <div className="header-user-avatar">
            {username.charAt(0).toUpperCase()}
          </div>

          <div className="header-user-info">
            <strong>{username}</strong>
            <span>{roleLabels[role] || "User"}</span>
          </div>
        </button>
      </div>
    </header>
  );
}

export default Header;
