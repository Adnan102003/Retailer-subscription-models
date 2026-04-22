import { Route, Routes, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import Home from "./pages/Home";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Payment from "./pages/Payment";
import AdminDashboard from "./pages/AdminDashboard";
import ChamberHome from "./pages/chamber/Home";
import ChamberCustomers from "./pages/chamber/Customers";
import ChamberCustomerNew from "./pages/chamber/CustomerNew";
import ChamberCustomerDetail from "./pages/chamber/CustomerDetail";
import ChamberFruitDetail from "./pages/chamber/FruitDetail";
import ChamberNotifications from "./pages/chamber/Notifications";
import ChamberDeveloper from "./pages/chamber/Developer";
import ChamberDashboard from "./pages/chamber/Dashboard";

const App = () => {
  const location = useLocation();
  const isHome = location.pathname === "/";
  const chamberPaths = ["/dashboard", "/customers", "/notifications", "/developer", "/chamber/dashboard"];
  const isChamber =
    chamberPaths.includes(location.pathname) ||
    location.pathname.startsWith("/customers/");

  return (
    <div className="min-h-screen">
      <Navbar />
      <main
        className={
          isHome
            ? ""
            : isChamber
              ? "max-w-7xl mx-auto px-4 py-6 lg:px-6"
              : "max-w-6xl mx-auto px-4 py-8"
        }
      >
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/payment"
            element={
              <ProtectedRoute>
                <Payment />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <ChamberHome />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chamber/dashboard"
            element={
              <ProtectedRoute>
                <ChamberDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customers"
            element={
              <ProtectedRoute>
                <ChamberCustomers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customers/new"
            element={
              <ProtectedRoute>
                <ChamberCustomerNew />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customers/:id"
            element={
              <ProtectedRoute>
                <ChamberCustomerDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customers/:customerId/fruits/:fruitId"
            element={
              <ProtectedRoute>
                <ChamberFruitDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <ChamberNotifications />
              </ProtectedRoute>
            }
          />
          <Route
            path="/developer"
            element={
              <ProtectedRoute>
                <ChamberDeveloper />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <AdminProtectedRoute>
                <AdminDashboard />
              </AdminProtectedRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
};

export default App;

