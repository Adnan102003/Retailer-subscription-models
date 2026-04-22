import { Link, useLocation, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const adminToken = localStorage.getItem("adminToken");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const onLogout = () => {
    logout();
    navigate("/");
  };

  const onAdminLogout = () => {
    localStorage.removeItem("adminToken");
    navigate("/login");
  };

  const userInitial = useMemo(() => {
    const letter = (user?.name || user?.email || "U").trim().charAt(0) || "U";
    return letter.toUpperCase();
  }, [user?.name, user?.email]);

  const scrollToSection = async (id) => {
    // Always behave the same in both login states:
    // Home click -> go "/" (top), Features click -> go "/" and scroll to section.
    if (location.pathname !== "/") {
      navigate("/");
      // wait for route render then scroll
      await new Promise((r) => setTimeout(r, 50));
    }
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const goHome = async () => {
    setDrawerOpen(false);
    if (location.pathname !== "/") {
      navigate("/");
      return;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <header className="border-b bg-white/95 backdrop-blur sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="font-bold text-2xl text-blue-800">ColdStore Pro</Link>
        <div className="flex items-center gap-4 text-sm md:text-base">
          <button type="button" onClick={goHome} className="text-slate-700 hover:text-blue-700">
            Home
          </button>
          <button type="button" onClick={() => scrollToSection("features")} className="text-slate-700 hover:text-blue-700">
            Features
          </button>
          {!user && <Link to="/login" className="px-4 py-2 rounded-xl border border-slate-300 text-slate-800">Sign In</Link>}
          {!user && <Link to="/register" className="px-4 py-2 rounded-xl bg-blue-600 text-white">Get Started</Link>}
          {user && <Link to="/payment" className="text-slate-700 hover:text-blue-700">Payment</Link>}
          {user && <Link to="/dashboard" className="text-slate-700 hover:text-blue-700">Fruit Chamber</Link>}
          {user && (
            <>
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="h-10 w-10 rounded-full bg-slate-900 text-white font-semibold flex items-center justify-center"
                aria-label="Account menu"
              >
                {userInitial}
              </button>
              {drawerOpen && (
                <div className="fixed inset-0 z-50">
                  <button
                    type="button"
                    className="absolute inset-0 bg-transparent"
                    onClick={() => setDrawerOpen(false)}
                    aria-label="Close menu"
                  />
                  <aside className="absolute right-0 top-0 h-full w-[320px] max-w-[85vw] border-l border-slate-200 bg-white shadow-2xl">
                    <div className="border-b border-slate-200 bg-white p-5">
                      <div className="flex items-center gap-3">
                        <div className="h-11 w-11 rounded-full bg-slate-900 text-white font-semibold flex items-center justify-center">
                          {userInitial}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 truncate">{user?.name || "Account"}</p>
                          <p className="text-sm text-slate-600 truncate">{user?.email}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1 bg-white p-3">
                      <button
                        type="button"
                        onClick={() => {
                          setDrawerOpen(false);
                          navigate("/dashboard");
                        }}
                        className="w-full text-left rounded-xl px-4 py-3 text-sm font-medium text-slate-900 hover:bg-slate-50"
                      >
                        Fruit Chamber
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDrawerOpen(false);
                          navigate("/payment");
                        }}
                        className="w-full text-left rounded-xl px-4 py-3 text-sm font-medium text-slate-900 hover:bg-slate-50"
                      >
                        Payment
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDrawerOpen(false);
                          scrollToSection("features");
                        }}
                        className="w-full text-left rounded-xl px-4 py-3 text-sm font-medium text-slate-900 hover:bg-slate-50"
                      >
                        View Features
                      </button>
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 border-t border-slate-200 bg-white p-3">
                      <button
                        type="button"
                        onClick={() => {
                          setDrawerOpen(false);
                          onLogout();
                        }}
                        className="w-full rounded-xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white hover:bg-rose-700"
                      >
                        Logout
                      </button>
                      {adminToken && (
                        <button
                          type="button"
                          onClick={() => {
                            setDrawerOpen(false);
                            onAdminLogout();
                          }}
                          className="mt-2 w-full rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 hover:bg-rose-100"
                        >
                          Admin Logout
                        </button>
                      )}
                    </div>
                  </aside>
                </div>
              )}
            </>
          )}
          {adminToken && (
            <button onClick={onAdminLogout} className="px-3 py-1 bg-rose-600 text-white rounded-xl">
              Admin Logout
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;

