import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import InfoCard from "../components/InfoCard";

const Dashboard = () => {
  const { user, setUser } = useAuth();
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({
    totalItems: 0,
    activeItems: 0,
    totalQuantity: 0,
    estimatedMonthlyRent: 0
  });
  const [form, setForm] = useState({
    itemName: "",
    category: "",
    quantity: "",
    rentPerUnit: ""
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "" });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");

  const status = user?.isApproved ? "Approved" : user?.isRejected ? "Rejected" : "Pending";

  const loadInventory = async () => {
    try {
      setLoading(true);
      setError("");
      const [itemsResponse, summaryResponse] = await Promise.all([
        api.get("/inventory/me"),
        api.get("/inventory/summary")
      ]);
      setItems(itemsResponse.data.items || []);
      setSummary(
        summaryResponse.data.summary || {
          totalItems: 0,
          activeItems: 0,
          totalQuantity: 0,
          estimatedMonthlyRent: 0
        }
      );
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load inventory data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const onChangePassword = async (e) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordMessage("");
    setError("");
    try {
      await api.post("/auth/change-password", passwordForm);
      setUser((prev) => ({ ...prev, mustChangePassword: false }));
      setPasswordForm({ currentPassword: "", newPassword: "" });
      setPasswordMessage("Password changed successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to change password");
    } finally {
      setPasswordLoading(false);
    }
  };

  const onChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError("");
      await api.post("/inventory", {
        itemName: form.itemName,
        category: form.category || "General",
        quantity: Number(form.quantity),
        rentPerUnit: Number(form.rentPerUnit),
        unit: "MT",
        storageLocation: "Main Facility",
        temperatureZone: "0 to 4 C",
        status: "active"
      });
      setForm({ itemName: "", category: "", quantity: "", rentPerUnit: "" });
      await loadInventory();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add inventory item");
    } finally {
      setSaving(false);
    }
  };

  const inventoryStats = [
    { label: "Total Items", value: summary.totalItems },
    { label: "Active Lots", value: summary.activeItems },
    { label: "Quantity Stored", value: `${summary.totalQuantity} MT` }
  ];
  const rentTimeline = [
    { title: "Monthly Projection", note: `Estimated rent: Rs. ${summary.estimatedMonthlyRent}`, state: "Live" },
    { title: "Inventory Billing", note: "Calculated from quantity x rent per unit", state: "Automated" },
    { title: "Overdue Alerts", note: "Ready for next backend rent module", state: "Roadmap" }
  ];

  return (
    <div className="space-y-6">
      <InfoCard title="Cold Storage User Dashboard">
        <div className="mt-2 grid gap-3 md:grid-cols-3 text-sm">
          <div className="rounded-xl bg-slate-50 px-4 py-3">
            <p className="text-slate-500">Account</p>
            <p className="font-medium text-slate-900">{user?.name}</p>
          </div>
          <div className="rounded-xl bg-slate-50 px-4 py-3">
            <p className="text-slate-500">Payment</p>
            <p className={`font-medium ${user?.isPaid ? "text-emerald-700" : "text-amber-700"}`}>{user?.isPaid ? "Paid" : "Pending"}</p>
          </div>
          <div className="rounded-xl bg-slate-50 px-4 py-3">
            <p className="text-slate-500">Approval</p>
            <p className={`font-medium ${status === "Approved" ? "text-blue-700" : status === "Rejected" ? "text-rose-700" : "text-amber-700"}`}>{status}</p>
          </div>
        </div>
        {user?.mustChangePassword && (
          <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
            First login detected. Change password to continue using all features.
          </p>
        )}
        {!user?.mustChangePassword && (!user?.selectedPlan || user?.subscriptionStatus === "expired") && (
          <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            Subscription inactive or expired. <Link to="/payment" className="underline">Choose a plan</Link> to restore access.
          </p>
        )}
      </InfoCard>

      {user?.mustChangePassword && (
        <InfoCard title="Change Password (Required)">
          <form onSubmit={onChangePassword} className="grid gap-3 md:grid-cols-2">
            <input
              type="password"
              placeholder="Current password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
              required
              className="rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
            <input
              type="password"
              placeholder="New password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
              required
              minLength={6}
              className="rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
            <button
              type="submit"
              disabled={passwordLoading}
              className="md:col-span-2 rounded-xl bg-slate-900 px-4 py-2.5 text-white hover:bg-slate-800 disabled:opacity-70"
            >
              {passwordLoading ? "Updating..." : "Update Password"}
            </button>
          </form>
          {passwordMessage && <p className="mt-3 text-sm text-emerald-700">{passwordMessage}</p>}
        </InfoCard>
      )}

      <InfoCard title="Inventory Overview">
        <div className="grid gap-3 md:grid-cols-3">
          {inventoryStats.map((item) => (
            <div key={item.label} className="rounded-xl border border-slate-200 bg-white px-4 py-4">
              <p className="text-sm text-slate-500">{item.label}</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">{item.value}</p>
            </div>
          ))}
        </div>
      </InfoCard>

      <InfoCard title="Add Inventory Item">
        <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-2">
          <input
            name="itemName"
            placeholder="Item name (e.g., Frozen Peas)"
            value={form.itemName}
            onChange={onChange}
            required
            className="rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          />
          <input
            name="category"
            placeholder="Category (e.g., Vegetables)"
            value={form.category}
            onChange={onChange}
            className="rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          />
          <input
            name="quantity"
            type="number"
            min="0"
            step="0.01"
            placeholder="Quantity in MT"
            value={form.quantity}
            onChange={onChange}
            required
            className="rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          />
          <input
            name="rentPerUnit"
            type="number"
            min="0"
            step="0.01"
            placeholder="Rent per MT"
            value={form.rentPerUnit}
            onChange={onChange}
            required
            className="rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          />
          <button
            type="submit"
            disabled={saving}
            className="md:col-span-2 rounded-xl bg-slate-900 px-4 py-2.5 text-white hover:bg-slate-800 disabled:opacity-70"
          >
            {saving ? "Saving..." : "Add Inventory Item"}
          </button>
        </form>
      </InfoCard>

      <InfoCard title="Recent Inventory Lots">
        {loading ? (
          <p className="text-sm text-slate-600">Loading inventory...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-slate-600">No inventory items yet. Add your first lot above.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="px-3 py-3 font-medium">Item</th>
                  <th className="px-3 py-3 font-medium">Category</th>
                  <th className="px-3 py-3 font-medium">Quantity</th>
                  <th className="px-3 py-3 font-medium">Rent/MT</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {items.slice(0, 8).map((item) => (
                  <tr key={item._id} className="border-b border-slate-100">
                    <td className="px-3 py-3 font-medium text-slate-900">{item.itemName}</td>
                    <td className="px-3 py-3 text-slate-700">{item.category}</td>
                    <td className="px-3 py-3 text-slate-700">{item.quantity} {item.unit}</td>
                    <td className="px-3 py-3 text-slate-700">Rs. {item.rentPerUnit}</td>
                    <td className="px-3 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${item.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"}`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </InfoCard>

      <InfoCard title="Rental & Billing Updates">
        <div className="space-y-3">
          {rentTimeline.map((item) => (
            <div key={item.title} className="rounded-xl border border-slate-200 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-slate-900">{item.title}</p>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700">{item.state}</span>
              </div>
              <p className="mt-1 text-sm text-slate-600">{item.note}</p>
            </div>
          ))}
        </div>
      </InfoCard>

      {error && <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
    </div>
  );
};

export default Dashboard;

