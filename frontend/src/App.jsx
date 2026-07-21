import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { useAuth } from "./context/AuthContext";

import ActivitiesPage from "./pages/ActivitiesPage";
import CourseDetailPage from "./pages/CourseDetailPage";
import CoursesPage from "./pages/CoursesPage";
import DashboardPage from "./pages/DashboardPage";
import ExamGradesPage from "./pages/ExamGradesPage";
import GradesPage from "./pages/GradesPage";
import GroupDetailPage from "./pages/GroupDetailPage";
import GroupsPage from "./pages/GroupsPage";
import LoginPage from "./pages/LoginPage";
import MentorDetailPage from "./pages/MentorDetailPage";
import MentorEnrollmentsPage from "./pages/MentorEnrollmentsPage";
import MentorsPage from "./pages/MentorsPage";
import NotFoundPage from "./pages/NotFoundPage";
import ProfilePage from "./pages/ProfilePage";
import StudentDetailPage from "./pages/StudentDetailPage";
import StudentEnrollmentsPage from "./pages/StudentEnrollmentsPage";
import StudentsPage from "./pages/StudentsPage";
import TimetablesPage from "./pages/TimetablesPage";

function ProtectedRoute({ children, allowedRoles }) {
  const { currentUser, role, authLoading } = useAuth();
  const accessToken = localStorage.getItem("access");

  if (authLoading) {
    return (
      <div className="app-auth-loading">
        <span />
        <p>Ҳисоб санҷида истодааст...</p>
      </div>
    );
  }

  if (!accessToken || !currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function PublicOnlyRoute({ children }) {
  const { currentUser, authLoading } = useAuth();
  const accessToken = localStorage.getItem("access");

  if (authLoading) {
    return (
      <div className="app-auth-loading">
        <span />
        <p>Ҳисоб санҷида истодааст...</p>
      </div>
    );
  }

  if (accessToken && currentUser) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function PageRoute({ children, roles }) {
  return (
    <ProtectedRoute allowedRoles={roles}>
      {children}
    </ProtectedRoute>
  );
}

const allRoles = ["admin", "mentor", "student"];

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <LoginPage />
            </PublicOnlyRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <PageRoute roles={allRoles}>
              <DashboardPage />
            </PageRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <PageRoute roles={allRoles}>
              <ProfilePage />
            </PageRoute>
          }
        />

        <Route
          path="/students"
          element={
            <PageRoute roles={["admin", "mentor"]}>
              <StudentsPage />
            </PageRoute>
          }
        />

        <Route
          path="/students/:id"
          element={
            <PageRoute roles={allRoles}>
              <StudentDetailPage />
            </PageRoute>
          }
        />

        <Route
          path="/mentors"
          element={
            <PageRoute roles={allRoles}>
              <MentorsPage />
            </PageRoute>
          }
        />

        <Route
          path="/mentors/:id"
          element={
            <PageRoute roles={allRoles}>
              <MentorDetailPage />
            </PageRoute>
          }
        />

        <Route
          path="/courses"
          element={
            <PageRoute roles={allRoles}>
              <CoursesPage />
            </PageRoute>
          }
        />

        <Route
          path="/courses/:id"
          element={
            <PageRoute roles={allRoles}>
              <CourseDetailPage />
            </PageRoute>
          }
        />

        <Route
          path="/groups"
          element={
            <PageRoute roles={allRoles}>
              <GroupsPage />
            </PageRoute>
          }
        />

        <Route
          path="/groups/:id"
          element={
            <PageRoute roles={allRoles}>
              <GroupDetailPage />
            </PageRoute>
          }
        />

        <Route
          path="/timetables"
          element={
            <PageRoute roles={allRoles}>
              <TimetablesPage />
            </PageRoute>
          }
        />

        <Route
          path="/student-enrollments"
          element={
            <PageRoute roles={["admin"]}>
              <StudentEnrollmentsPage />
            </PageRoute>
          }
        />

        <Route
          path="/mentor-enrollments"
          element={
            <PageRoute roles={["admin"]}>
              <MentorEnrollmentsPage />
            </PageRoute>
          }
        />

        <Route
          path="/activities"
          element={
            <PageRoute roles={allRoles}>
              <ActivitiesPage />
            </PageRoute>
          }
        />

        <Route
          path="/grades"
          element={
            <PageRoute roles={allRoles}>
              <GradesPage />
            </PageRoute>
          }
        />

        <Route
          path="/exam-grades"
          element={
            <PageRoute roles={allRoles}>
              <ExamGradesPage />
            </PageRoute>
          }
        />

        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route
          path="*"
          element={
            <PageRoute roles={allRoles}>
              <NotFoundPage />
            </PageRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
