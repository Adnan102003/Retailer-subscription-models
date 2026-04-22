import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionLoadingMap, setActionLoadingMap] = useState({});
  const [paymentRequests, setPaymentRequests] = useState([]);
  const [paymentStatusUsers, setPaymentStatusUsers] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [summary, setSummary] = useState({
    totalUsers: 0,
    totalChambers: 0,
    pendingSignupRequests: 0,
    paymentPendingUsers: 0
  });
  const [inventorySummary, setInventorySummary] = useState({
    totalItems: 0,
    activeItems: 0,
    totalQuantity: 0,
    projectedMonthlyRent: 0
  });
  const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  const serverOrigin = apiBaseUrl.replace(/\/api\/?$/, "");

  const getDocumentUrl = (docPath) => {
    if (!docPath) return "";
    if (docPath.startsWith("http://") || docPath.startsWith("https://")) return docPath;
    return `${serverOrigin}${docPath.startsWith("/") ? docPath : `/${docPath}`}`;
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("adminToken");
      const [usersResponse, inventoryResponse, paymentRequestsResponse, summaryResponse, paymentStatusResponse] = await Promise.all([
        api.get("/admin/users", {
          headers: { Authorization: `Bearer ${token}` }
        }),
        api.get("/inventory/admin/summary", {
          headers: { Authorization: `Bearer ${token}` }
        }),
        api.get("/admin/payment-requests", {
          headers: { Authorization: `Bearer ${token}` }
        }),
        api.get("/admin/summary", {
          headers: { Authorization: `Bearer ${token}` }
        }),
        api.get("/admin/payment-status", {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setUsers(usersResponse.data.users);
      setPaymentRequests(paymentRequestsResponse.data.requests || []);
      setPaymentStatusUsers(paymentStatusResponse.data.users || []);
      setSummary(summaryResponse.data.summary || summary);
      setRecentLogs(summaryResponse.data.recentLogs || []);
      setInventorySummary(
        inventoryResponse.data.summary || {
          totalItems: 0,
          activeItems: 0,
          totalQuantity: 0,
          projectedMonthlyRent: 0
        }
      );
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const updateStatus = async (id, action) => {
    try {
      setActionLoadingMap((prev) => ({ ...prev, [`${id}-${action}`]: true }));
      setError("");
      const token = localStorage.getItem("adminToken");
      await api.patch(`/admin/users/${id}/${action}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      await fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${action} user`);
    } finally {
      setActionLoadingMap((prev) => ({ ...prev, [`${id}-${action}`]: false }));
    }
  };

  const metrics = useMemo(() => {
    const paidUsers = users.filter((u) => u.isPaid).length;
    const approvedUsers = users.filter((u) => u.isApproved).length;
    const pendingUsers = users.filter((u) => !u.isApproved && !u.isRejected).length;
    const rejectedUsers = users.filter((u) => u.isRejected).length;
    return { paidUsers, approvedUsers, pendingUsers, rejectedUsers };
  }, [users]);

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return users.filter((u) => {
      const status =
        statusFilter === "all" ||
        (statusFilter === "paid" && u.isPaid) ||
        (statusFilter === "unpaid" && !u.isPaid) ||
        (statusFilter === "approved" && u.isApproved) ||
        (statusFilter === "pending" && !u.isApproved && !u.isRejected) ||
        (statusFilter === "rejected" && u.isRejected);

      const search =
        !normalizedQuery ||
        u.name?.toLowerCase().includes(normalizedQuery) ||
        u.email?.toLowerCase().includes(normalizedQuery) ||
        u.phone?.toLowerCase().includes(normalizedQuery) ||
        u.businessRegistrationNumber?.toLowerCase().includes(normalizedQuery) ||
        u.chamberLocation?.toLowerCase().includes(normalizedQuery);

      return status && search;
    });
  }, [users, query, statusFilter]);

  return (
    <section className="space-y-6">
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 to-blue-900 p-8 text-white shadow-xl">
        <p className="text-xs uppercase tracking-[0.2em] text-white/70">ColdStore Pro</p>
        <h2 className="mt-2 text-3xl font-semibold">Admin Control Center</h2>
        <p className="mt-2 text-white/80">
          Monitor account approvals and payment readiness for cold storage inventory operations.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Total Registrations</p>
          <p className="mt-1 text-3xl font-semibold text-slate-900">{summary.totalUsers}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Payment Completed</p>
          <p className="mt-1 text-3xl font-semibold text-emerald-700">{metrics.paidUsers}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Pending Signup Requests</p>
          <p className="mt-1 text-3xl font-semibold text-amber-600">{summary.pendingSignupRequests}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Total Chambers</p>
          <p className="mt-1 text-3xl font-semibold text-slate-900">{summary.totalChambers}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Approved Users</p>
          <p className="mt-1 text-3xl font-semibold text-blue-700">{metrics.approvedUsers}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Rejected Users</p>
          <p className="mt-1 text-3xl font-semibold text-rose-700">{metrics.rejectedUsers}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Payment Pending Users</p>
          <p className="mt-1 text-3xl font-semibold text-emerald-700">{summary.paymentPendingUsers}</p>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-xl font-semibold text-slate-900">Recent Activities / Logs</h3>
        <div className="mt-4 space-y-2">
          {recentLogs.map((log) => (
            <div key={log._id} className="rounded-xl border border-slate-200 px-4 py-3">
              <p className="font-medium text-slate-800">{log.action}</p>
              <p className="text-sm text-slate-600">{log.message}</p>
            </div>
          ))}
          {recentLogs.length === 0 && <p className="text-sm text-slate-500">No activity logs yet.</p>}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h3 className="text-xl font-semibold text-slate-900">User Approval Queue</h3>
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
        <p className="mt-1 text-sm text-slate-600">Approve signup requests to grant system access.</p>
        {paymentRequests.length > 0 && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {paymentRequests.length} signup request{paymentRequests.length > 1 ? "s are" : " is"} waiting for admin review.
          </div>
        )}

        {error && <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_220px]">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or email"
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="paid">Paid only</option>
            <option value="unpaid">Unpaid only</option>
          </select>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[1320px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="px-3 py-3 font-medium">Name</th>
                <th className="px-3 py-3 font-medium">Email</th>
                <th className="px-3 py-3 font-medium">Phone</th>
                <th className="px-3 py-3 font-medium">Business Reg. No.</th>
                <th className="px-3 py-3 font-medium">Address</th>
                <th className="px-3 py-3 font-medium">Document</th>
                <th className="px-3 py-3 font-medium">Payment</th>
                <th className="px-3 py-3 font-medium">Approval</th>
                <th className="px-3 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan="9" className="px-3 py-8 text-center text-slate-500">
                    Loading users...
                  </td>
                </tr>
              )}
              {!loading && filteredUsers.map((u) => {
                const status = u.isApproved ? "Approved" : u.isRejected ? "Rejected" : "Pending";
                const documentUrl = getDocumentUrl(u.documentUpload);
                return (
                  <tr key={u._id} className="border-b border-slate-100">
                    <td className="px-3 py-3 font-medium text-slate-900">{u.name}</td>
                    <td className="px-3 py-3 text-slate-700">{u.email}</td>
                    <td className="px-3 py-3 text-slate-700">{u.phone || "-"}</td>
                    <td className="px-3 py-3 text-slate-700">{u.businessRegistrationNumber || "-"}</td>
                    <td className="max-w-[260px] px-3 py-3 text-slate-700">
                      <p className="line-clamp-2">{u.chamberLocation || "-"}</p>
                    </td>
                    <td className="px-3 py-3">
                      {documentUrl ? (
                        <a href={documentUrl} target="_blank" rel="noreferrer" className="block">
                          <img
                            src={documentUrl}
                            alt={`${u.name} document`}
                            className="h-14 w-20 rounded-md border border-slate-200 object-cover"
                          />
                          <span className="mt-1 inline-block text-xs text-blue-700">Open</span>
                        </a>
                      ) : (
                        <span className="text-xs text-slate-500">No document</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${u.isPaid ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                        {u.isPaid ? "Paid" : "Unpaid"}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${u.isApproved ? "bg-blue-100 text-blue-700" : u.isRejected ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-700"}`}>
                        {status}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setSelectedUser(u)}
                          className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-blue-700 transition hover:bg-blue-100"
                        >
                          View details
                        </button>
                        <button
                          onClick={() => updateStatus(u._id, "approve")}
                          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={actionLoadingMap[`${u._id}-approve`]}
                        >
                          {actionLoadingMap[`${u._id}-approve`] ? "Approving..." : "Approve"}
                        </button>
                        <button
                          onClick={() => updateStatus(u._id, "reject")}
                          className="rounded-lg bg-rose-600 px-3 py-1.5 text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={actionLoadingMap[`${u._id}-reject`]}
                        >
                          {actionLoadingMap[`${u._id}-reject`] ? "Rejecting..." : "Reject"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!loading && filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="9" className="px-3 py-8 text-center text-slate-500">
                    No users match the selected filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedUser && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-semibold text-slate-900">User Full Details</h3>
                <p className="mt-1 text-sm text-slate-600">Registration details submitted by the user.</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-[1fr_320px]">
              <div className="space-y-3 rounded-xl border border-slate-200 p-4">
                <p className="text-sm">
                  <span className="font-semibold text-slate-800">Name:</span> <span className="text-slate-700">{selectedUser.name || "-"}</span>
                </p>
                <p className="text-sm">
                  <span className="font-semibold text-slate-800">Email:</span> <span className="text-slate-700">{selectedUser.email || "-"}</span>
                </p>
                <p className="text-sm">
                  <span className="font-semibold text-slate-800">Phone:</span> <span className="text-slate-700">{selectedUser.phone || "-"}</span>
                </p>
                <p className="text-sm">
                  <span className="font-semibold text-slate-800">Business Registration Number:</span>{" "}
                  <span className="text-slate-700">{selectedUser.businessRegistrationNumber || "-"}</span>
                </p>
                <p className="text-sm">
                  <span className="font-semibold text-slate-800">Address:</span> <span className="text-slate-700">{selectedUser.chamberLocation || "-"}</span>
                </p>
                <p className="text-sm">
                  <span className="font-semibold text-slate-800">Payment:</span>{" "}
                  <span className={selectedUser.isPaid ? "font-medium text-emerald-700" : "font-medium text-amber-700"}>
                    {selectedUser.isPaid ? "Paid" : "Unpaid"}
                  </span>
                </p>
                <p className="text-sm">
                  <span className="font-semibold text-slate-800">Approval:</span>{" "}
                  <span
                    className={
                      selectedUser.isApproved
                        ? "font-medium text-blue-700"
                        : selectedUser.isRejected
                          ? "font-medium text-rose-700"
                          : "font-medium text-slate-700"
                    }
                  >
                    {selectedUser.isApproved ? "Approved" : selectedUser.isRejected ? "Rejected" : "Pending"}
                  </span>
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-sm font-semibold text-slate-800">Document Photo</p>
                {getDocumentUrl(selectedUser.documentUpload) ? (
                  <a href={getDocumentUrl(selectedUser.documentUpload)} target="_blank" rel="noreferrer" className="mt-3 block">
                    <img
                      src={getDocumentUrl(selectedUser.documentUpload)}
                      alt={`${selectedUser.name} document`}
                      className="h-72 w-full rounded-lg border border-slate-200 object-cover"
                    />
                    <span className="mt-2 inline-block text-sm font-medium text-blue-700">Open original document</span>
                  </a>
                ) : (
                  <p className="mt-3 text-sm text-slate-500">No document uploaded.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-xl font-semibold text-slate-900">User Payment Status</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="px-3 py-3 font-medium">User</th>
                <th className="px-3 py-3 font-medium">Plan</th>
                <th className="px-3 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {paymentStatusUsers.slice(0, 12).map((u) => (
                <tr key={u._id} className="border-b border-slate-100">
                  <td className="px-3 py-3 text-slate-800">{u.name}</td>
                  <td className="px-3 py-3 text-slate-700">{u.selectedPlan || "-"}</td>
                  <td className="px-3 py-3 text-slate-700">{u.subscriptionStatus || "inactive"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default AdminDashboard;

