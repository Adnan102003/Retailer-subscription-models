import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";

const Register = () => {
  const [form, setForm] = useState({
    name: "",
    businessRegistrationNumber: "",
    email: "",
    phone: "",
    chamberLocation: ""
  });
  const [verificationId, setVerificationId] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [documentUpload, setDocumentUpload] = useState(null);
  const navigate = useNavigate();

  const onChange = (e) => {
    const { name, value } = e.target;
    let nextValue = value;

    if (name === "name") {
      nextValue = value.replace(/[^A-Za-z\s]/g, "");
    }

    if (name === "businessRegistrationNumber") {
      nextValue = value.replace(/[^A-Za-z0-9-]/g, "").slice(0, 80);
    }

    if (name === "phone") {
      nextValue = value.replace(/\D/g, "").slice(0, 10);
    }

    setForm((p) => ({ ...p, [name]: nextValue }));
    setFieldErrors((prev) => ({ ...prev, [name]: "" }));
  };
  const resolveErrorMessage = (err) => {
    if (!err.response) return "Server unavailable. Please ensure backend and MongoDB are running.";
    if (err.response?.data?.errors?.length) return err.response.data.errors[0].msg;
    return err.response?.data?.message || "Registration failed";
  };

  const validateBeforeOtp = () => {
    const errors = {};
    if (!/^[A-Za-z\s]{2,120}$/.test(form.name.trim())) errors.name = "Name must contain letters only";
    if (!/^[A-Za-z0-9-]{3,80}$/.test(form.businessRegistrationNumber.trim())) errors.businessRegistrationNumber = "Business registration number invalid";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errors.email = "Valid email address required";
    if (!/^\d{10}$/.test(form.phone)) errors.phone = "Phone number exactly 10 digits required";
    if (form.chamberLocation.trim().length < 3) errors.chamberLocation = "Address is required";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const sendEmailOtp = async () => {
    setError("");
    setSuccess("");
    if (!validateBeforeOtp()) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("businessRegistrationNumber", form.businessRegistrationNumber);
      formData.append("email", form.email);
      formData.append("phone", form.phone);
      formData.append("chamberLocation", form.chamberLocation);
      if (documentUpload) {
        formData.append("documentUpload", documentUpload);
      }

      const { data } = await api.post("/auth/send-email-otp", formData);
      setVerificationId(data.verificationId);
      setEmailVerified(false);
      setEmailOtp("");
      setSuccess("Email OTP sent successfully.");
    } catch (err) {
      setError(resolveErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const verifyEmailOtp = async () => {
    setError("");
    setSuccess("");
    if (!verificationId) {
      setError("Please send email OTP first.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/verify-email-otp", { verificationId, emailOtp });
      setEmailVerified(true);
      setSuccess("Email verified.");
      setEmailOtp("");
    } catch (err) {
      setError(resolveErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    const trimmedName = form.name.trim();
    if (!emailVerified) {
      setError("Email verification is compulsory.");
      return;
    }
    if (!/^[A-Za-z\s]{2,120}$/.test(trimmedName)) {
      setError("Please enter a valid name (letters only)");
      return;
    }
    if (!/^\d{10}$/.test(form.phone)) {
      setError("Please enter a valid phone number (10 digits)");
      return;
    }
    setLoading(true);
    try {
      const payload = { ...form, name: trimmedName, verificationId };
      await api.post("/auth/register", payload);
      setSuccess("Signup request submitted successfully. Redirecting to login...");
      setTimeout(() => navigate("/login"), 1000);
    } catch (err) {
      setError(resolveErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <section className="min-h-[calc(100vh-8rem)] flex items-center justify-center py-6">
      <div className="w-full max-w-5xl grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-xl sm:p-10">
          <div className="mb-7 space-y-2">
            <h2 className="text-3xl font-semibold text-slate-900">Create your account</h2>
            <p className="text-sm text-slate-600">Set up your cold storage management profile in less than a minute.</p>
          </div>

          {error && <p className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
          {success && <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p>}

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="name" className="text-sm font-medium text-slate-700">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="John Doe"
                value={form.name}
                onChange={onChange}
                minLength={2}
                maxLength={120}
                autoComplete="name"
                required
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
              {fieldErrors.name && <p className="text-xs text-rose-600">{fieldErrors.name}</p>}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="businessRegistrationNumber" className="text-sm font-medium text-slate-700">
                Business Registration Number
              </label>
              <input
                id="businessRegistrationNumber"
                name="businessRegistrationNumber"
                type="text"
                placeholder="BRN-001122"
                value={form.businessRegistrationNumber}
                onChange={onChange}
                required
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
              {fieldErrors.businessRegistrationNumber && <p className="text-xs text-rose-600">{fieldErrors.businessRegistrationNumber}</p>}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium text-slate-700">
                Email Address
              </label>
              <div className="flex gap-2 items-center">
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={onChange}
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
                {emailVerified && (
                  <span className="rounded-xl bg-emerald-100 px-3 py-2 text-sm font-medium text-emerald-700">Verified</span>
                )}
              </div>
              {fieldErrors.email && <p className="text-xs text-rose-600">{fieldErrors.email}</p>}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="phone" className="text-sm font-medium text-slate-700">
                Phone Number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                placeholder="9876543210"
                value={form.phone}
                onChange={onChange}
                inputMode="numeric"
                pattern="[0-9]{10}"
                maxLength={10}
                autoComplete="tel"
                required
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
              {fieldErrors.phone && <p className="text-xs text-rose-600">{fieldErrors.phone}</p>}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="chamberLocation" className="text-sm font-medium text-slate-700">
                Address
              </label>
              <input
                id="chamberLocation"
                name="chamberLocation"
                type="text"
                placeholder="Enter address"
                value={form.chamberLocation}
                onChange={onChange}
                required
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
              {fieldErrors.chamberLocation && <p className="text-xs text-rose-600">{fieldErrors.chamberLocation}</p>}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="documentUpload" className="text-sm font-medium text-slate-700">
                Document Upload
              </label>
              <input
                id="documentUpload"
                name="documentUpload"
                type="file"
                accept="image/*"
                onChange={(e) => setDocumentUpload(e.target.files?.[0] || null)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700"
              />
              {documentUpload && (
                <p className="text-xs text-slate-600">Selected: {documentUpload.name}</p>
              )}
            </div>

            {!emailVerified && (
              <button
                type="button"
                onClick={sendEmailOtp}
                className="w-full rounded-xl border border-blue-600 px-4 py-2.5 text-sm font-medium text-blue-700"
                disabled={loading}
              >
                Send OTP
              </button>
            )}

            {!emailVerified && verificationId && (
              <div className="mt-2 flex gap-2">
                <input
                  placeholder="Enter Email OTP"
                  value={emailOtp}
                  onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  maxLength={6}
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5"
                />
                <button type="button" onClick={verifyEmailOtp} className="rounded-xl border border-slate-300 px-4 py-2 text-sm" disabled={loading || emailOtp.length !== 6}>
                  Verify
                </button>
              </div>
            )}

            <button
              disabled={loading}
              className="w-full rounded-xl bg-blue-700 px-4 py-2.5 font-medium text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Please wait..." : "Submit Signup Request"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-blue-700 hover:text-blue-800">
              Sign in
            </Link>
          </p>
        </div>

        <div className="hidden lg:flex rounded-3xl bg-gradient-to-br from-slate-900 to-slate-700 p-10 text-white shadow-xl">
          <div className="my-auto space-y-5">
            <p className="inline-flex w-fit rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs tracking-wide uppercase">
              Cold Storage Suite
            </p>
            <h1 className="text-4xl font-bold leading-tight">Run efficient cold room workflows from day one.</h1>
            <p className="text-white/85">
              Join teams already using ColdStore Pro to manage storage access, approvals, and daily operations.
            </p>
          </div>
        </div>
      </div>
      </section>
    </>
  );
};

export default Register;

