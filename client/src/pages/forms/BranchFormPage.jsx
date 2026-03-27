import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FiLayers,
  FiMail,
  FiMapPin,
  FiArrowLeft,
  FiSave,
  FiUser,
  FiClock,
} from "react-icons/fi";
import API from "../../services/api";
import useFormValidation, { rules } from "../../hooks/useFormValidation";
import FieldError from "../../components/FieldError";
import { useToast } from "../../context/ToastContext";
import { getCurrentUser } from "../../context/AuthContext";

const BRANCH_TYPES = [
  { value: "head_office", label: "Head Office" },
  { value: "regional_office", label: "Regional Office" },
  { value: "sales_branch", label: "Sales Branch" },
  { value: "support_center", label: "Support Center" },
  { value: "warehouse", label: "Warehouse" },
];

const BRANCH_STATUSES = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "closed", label: "Closed" },
];

const TIMEZONES = [
  "Asia/Kolkata",
  "Asia/Dubai",
  "America/New_York",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Singapore",
  "Australia/Sydney",
  "UTC",
];

const inputCls = (errors, field) =>
  `w-full px-3 py-2 bg-white border rounded-lg text-sm text-[#111827] placeholder-[#9CA3AF] outline-none transition-all focus:ring-2 focus:ring-[#0D9488]/20 focus:border-[#0D9488] ${
    errors[field] ? "border-[#EF4444]" : "border-[#E5E7EB]"
  }`;

const labelCls = "block text-sm font-medium text-[#6B7280] mb-1.5";
const cardCls = "bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden";
const sectionTitleCls = "text-sm font-semibold text-[#111827] px-5 py-4 border-b border-[#E5E7EB] bg-[#F8FAFC]";

export default function BranchFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();
  const currentUser = getCurrentUser();
  const isSuperAdmin = currentUser?.role === "super_admin";
  const apiBase = isSuperAdmin ? "/super-admin/branches" : "/branches";
  const usersBase = isSuperAdmin ? "/super-admin/users" : "/users";

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [step, setStep] = useState(0);
  const [companies, setCompanies] = useState([]);
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    branchCode: "",
    branchType: "sales_branch",
    status: "active",
    email: "",
    phone: "",
    alternatePhone: "",
    website: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    country: "India",
    postalCode: "",
    latitude: "",
    longitude: "",
    branchManagerId: "",
    managerEmail: "",
    managerPhone: "",
    assignedUserIds: [],
    openingDate: "",
    workingHours: "",
    timezone: "Asia/Kolkata",
    branchCapacity: "",
    logoUrl: "",
    description: "",
    documentUrls: [],
    companyId: currentUser?.companyId || "",
  });

  const fullSchema = {
    name: [rules.required("Branch name")],
    email: [],
    managerEmail: [],
    ...(isSuperAdmin && { companyId: [rules.required("Company")] }),
  };

  const stepSchema = (() => {
    // Validate only current step fields.
    // Step 1: Branch name (+ companyId for super admin)
    // Step 2: Manager email format (optional)
    // Step 3: Branch email format (optional)
    // Step 4/5: no required validations
    if (step === 0) return { name: fullSchema.name, ...(isSuperAdmin ? { companyId: fullSchema.companyId } : {}) };
    if (step === 1) return { managerEmail: fullSchema.managerEmail };
    if (step === 2) return { email: fullSchema.email };
    return {};
  })();

  const { errors, validate, clearError, clearAllErrors } = useFormValidation(stepSchema);

  const handleChange = useCallback(
    (e) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
      clearError(name);
    },
    [clearError]
  );

  const setField = useCallback((name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    clearError(name);
  }, [clearError]);

  // Fetch companies (super admin)
  useEffect(() => {
    if (!isSuperAdmin) return;
    API.get("/super-admin/companies?limit=500")
      .then((res) => {
        const data = res.data?.data || res.data?.companies || res.data;
        setCompanies(Array.isArray(data) ? data : []);
      })
      .catch(() => {});
  }, [isSuperAdmin]);

  // Fetch users for manager/assigned (when company known)
  const companyIdForUsers = isSuperAdmin ? formData.companyId : currentUser?.companyId;
  useEffect(() => {
    if (!companyIdForUsers) {
      setUsers([]);
      return;
    }
    const url = isSuperAdmin ? `${usersBase}?companyId=${companyIdForUsers}` : usersBase;
    API.get(url)
      .then((res) => {
        const data = res.data?.data || res.data || [];
        setUsers(Array.isArray(data) ? data : []);
      })
      .catch(() => setUsers([]));
  }, [companyIdForUsers, isSuperAdmin, usersBase]);

  // Fetch branch for edit
  useEffect(() => {
    if (!isEdit) {
      setFetching(false);
      return;
    }
    API.get(`${apiBase}/${id}`)
      .then((res) => {
        const b = res.data?.data || res.data;
        if (!b) return;
        setFormData({
          name: b.name || "",
          branchCode: b.branchCode || "",
          branchType: b.branchType || "sales_branch",
          status: b.status || "active",
          email: b.email || "",
          phone: b.phone || "",
          alternatePhone: b.alternatePhone || "",
          website: b.website || "",
          addressLine1: b.addressLine1 || "",
          addressLine2: b.addressLine2 || "",
          city: b.city || "",
          state: b.state || "",
          country: b.country || "India",
          postalCode: b.postalCode || "",
          latitude: b.latitude != null ? String(b.latitude) : "",
          longitude: b.longitude != null ? String(b.longitude) : "",
          branchManagerId: b.branchManagerId?._id || b.branchManagerId || "",
          managerEmail: b.managerEmail || "",
          managerPhone: b.managerPhone || "",
          assignedUserIds: Array.isArray(b.assignedUserIds) ? b.assignedUserIds.map((u) => (u?._id || u)) : [],
          openingDate: b.openingDate ? b.openingDate.slice(0, 10) : "",
          workingHours: b.workingHours || "",
          timezone: b.timezone || "Asia/Kolkata",
          branchCapacity: b.branchCapacity != null ? String(b.branchCapacity) : "",
          logoUrl: b.logoUrl || "",
          description: b.description || "",
          documentUrls: Array.isArray(b.documentUrls) ? b.documentUrls : [],
          companyId: b.companyId?._id || b.companyId || formData.companyId,
        });
      })
      .catch(() => toast.error("Failed to load branch"))
      .finally(() => setFetching(false));
  }, [id, isEdit, apiBase]);

  useEffect(() => {
    clearAllErrors?.();
  }, [step, clearAllErrors]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Final submit: still validate current step only (per requirement)
    if (!validate(formData)) {
      toast.error("Please fix the errors before saving.");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...formData,
        branchCode: formData.branchCode?.trim() || undefined,
        latitude: formData.latitude ? Number(formData.latitude) : undefined,
        longitude: formData.longitude ? Number(formData.longitude) : undefined,
        branchCapacity: formData.branchCapacity ? Number(formData.branchCapacity) : undefined,
        openingDate: formData.openingDate || undefined,
        assignedUserIds: formData.assignedUserIds.filter(Boolean),
        documentUrls: formData.documentUrls.filter(Boolean),
      };
      if (isEdit) {
        await API.put(`${apiBase}/${id}`, payload);
        toast.success("Branch updated successfully.");
      } else {
        await API.post(apiBase, payload);
        toast.success("Branch created successfully.");
      }
      navigate(-1);
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    const nameOk = Boolean(String(formData.name || "").trim());
    const companyOk = !isSuperAdmin || Boolean(String(formData.companyId || "").trim());
    if (!nameOk || !companyOk) {
      toast.error("Branch name is required to save a draft.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        status: "draft",
        name: String(formData.name || "").trim(),
        branchCode: formData.branchCode?.trim() || undefined,
        latitude: formData.latitude ? Number(formData.latitude) : undefined,
        longitude: formData.longitude ? Number(formData.longitude) : undefined,
        branchCapacity: formData.branchCapacity ? Number(formData.branchCapacity) : undefined,
        openingDate: formData.openingDate || undefined,
        assignedUserIds: formData.assignedUserIds.filter(Boolean),
        documentUrls: formData.documentUrls.filter(Boolean),
      };
      if (isEdit) {
        await API.put(`${apiBase}/${id}`, payload);
      } else {
        await API.post(apiBase, payload);
      }
      toast.success("Branch saved as draft");
      navigate(-1);
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const STEPS = [
    { key: "basic", label: "Basic Info" },
    { key: "management", label: "Management" },
    { key: "contact", label: "Contact" },
    { key: "address", label: "Address" },
    { key: "operational", label: "Operational" },
  ];

  const canGoNext = () => validate(formData);

  const goNext = () => {
    if (!canGoNext()) {
      toast.error("Please fix the errors before continuing.");
      return;
    }
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  };

  const goBack = () => setStep((s) => Math.max(0, s - 1));

  // Indian Postal API: pincode -> city, state, country
  const fetchAddressByPincode = useCallback(async (pincode) => {
    const pin = String(pincode).trim();
    if (pin.length !== 6 || !/^\d{6}$/.test(pin)) return;
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
      const data = await res.json();
      if (data && data[0]?.Status === "Success" && data[0].PostOffice?.length) {
        const po = data[0].PostOffice[0];
        setFormData((prev) => ({
          ...prev,
          city: po.District || prev.city,
          state: po.State || prev.state,
          country: po.Country || prev.country || "India",
        }));
      }
    } catch (_) {}
  }, []);

  // Levenshtein distance for typo-tolerant city match
  const editDistance = (a, b) => {
    const m = a.length, n = b.length;
    const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
      }
    }
    return dp[m][n];
  };

  // Indian Postal API: city/postoffice name -> pincode (pick result that best matches city name)
  const fetchPincodeByCity = useCallback(async (cityName) => {
    const name = String(cityName).trim();
    if (name.length < 2) return;
    const normalizedInput = name.toLowerCase();
    try {
      const res = await fetch(`https://api.postalpincode.in/postoffice/${encodeURIComponent(name)}`);
      const data = await res.json();
      if (!data || data[0]?.Status !== "Success" || !data[0].PostOffice?.length) return;
      const offices = data[0].PostOffice;
      // Prefer post office whose District (city) best matches user input; avoid wrong state
      const withDistrict = offices.filter((po) => po.District && po.Pincode);
      if (!withDistrict.length) return;
      let best = withDistrict[0];
      let bestScore = editDistance(normalizedInput, (best.District || "").toLowerCase());
      for (let i = 1; i < withDistrict.length; i++) {
        const d = (withDistrict[i].District || "").toLowerCase();
        const score = editDistance(normalizedInput, d);
        if (score < bestScore) {
          bestScore = score;
          best = withDistrict[i];
        }
      }
      // Only auto-fill if match is reasonable (allow 2–3 character typo for long names)
      const maxAllowed = Math.min(4, Math.ceil(best.District.length / 2));
      if (bestScore <= maxAllowed && best.Pincode) {
        setFormData((prev) => ({
          ...prev,
          postalCode: best.Pincode,
          state: best.State || prev.state,
          city: best.District || prev.city,
          country: best.Country || prev.country || "India",
        }));
      }
    } catch (_) {}
  }, []);

  const handlePostalCodeBlur = () => {
    if (formData.postalCode?.trim().length === 6) {
      fetchAddressByPincode(formData.postalCode.trim());
    }
  };

  const handleCityBlur = () => {
    if (formData.city?.trim().length >= 2) {
      fetchPincodeByCity(formData.city.trim());
    }
  };

  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-[#E5E7EB] border-t-[#0D9488] rounded-full animate-spin" />
        <p className="text-sm text-[#6B7280]">Loading branch...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-6rem)]">
      {/* Compact header */}
      <div className="shrink-0 flex items-center justify-between gap-4 px-4 py-3 bg-white border-b border-[#E5E7EB]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm font-semibold text-[#6B7280] hover:text-[#111827]"
          >
            <FiArrowLeft size={16} /> Back
          </button>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-[#F0FDF4] text-[#0D9488] flex items-center justify-center">
              <FiLayers size={18} />
            </div>
            <div>
              <h1 className="text-base font-bold text-[#111827]">
                {isEdit ? "Edit Branch" : "Create Branch"}
              </h1>
              <p className="text-[10px] text-[#6B7280]">{isEdit ? "Update details" : "Add new branch"}</p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex-1 min-h-0 overflow-auto pb-4">
        <div className="p-4 md:p-6 w-full">
          <div className="max-w-[1100px] mx-auto space-y-6">
            {/* Stepper */}
            <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                {STEPS.map((s, idx) => {
                  const active = idx === step;
                  const done = idx < step;
                  return (
                    <div key={s.key} className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border ${
                            active
                              ? "bg-[#0D9488] text-white border-[#0D9488]"
                              : done
                              ? "bg-[#F0FDF4] text-[#0D9488] border-[#CCFBF1]"
                              : "bg-white text-[#6B7280] border-[#E5E7EB]"
                          }`}
                        >
                          {idx + 1}
                        </div>
                        <span className={`text-sm font-semibold truncate ${active ? "text-[#111827]" : "text-[#6B7280]"}`}>
                          {s.label}
                        </span>
                      </div>
                      {idx < STEPS.length - 1 && (
                        <div className="mt-3 h-1 w-full bg-[#E5E7EB] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#0D9488] transition-all"
                            style={{ width: idx < step ? "100%" : "0%" }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step content */}
            {step === 0 && (
              <div className={cardCls}>
                <div className={sectionTitleCls}>Basic Information</div>
                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {isSuperAdmin && (
              <div className="sm:col-span-2">
                <label className={labelCls}>Company <span className="text-red-500">*</span></label>
                <select name="companyId" value={formData.companyId} onChange={handleChange} className={inputCls(errors, "companyId")}>
                  <option value="">Select company...</option>
                  {companies.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
                <FieldError error={errors.companyId} />
              </div>
            )}
            <div className="sm:col-span-2">
              <label className={labelCls}>Branch Name <span className="text-red-500">*</span></label>
              <input name="name" type="text" placeholder="e.g. Mumbai Regional Office" value={formData.name} onChange={handleChange} className={inputCls(errors, "name")} />
              <FieldError error={errors.name} />
            </div>
            <div>
              <label className={labelCls}>Branch Code</label>
              <input name="branchCode" type="text" placeholder="Auto if empty" value={formData.branchCode} onChange={handleChange} className={inputCls(errors, "branchCode")} />
            </div>
            <div>
              <label className={labelCls}>Type</label>
              <select name="branchType" value={formData.branchType} onChange={handleChange} className={inputCls(errors, "branchType")}>
                {BRANCH_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <select name="status" value={formData.status} onChange={handleChange} className={inputCls(errors, "status")}>
                {BRANCH_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>
            </div>
            )}

            {step === 1 && (
            <div className={cardCls}>
              <div className={sectionTitleCls}>Branch Management</div>
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Branch Manager</label>
              <select name="branchManagerId" value={formData.branchManagerId} onChange={handleChange} className={inputCls(errors, "branchManagerId")}>
                <option value="">Select manager...</option>
                {users.map((u) => <option key={u._id} value={u._id}>{u.name} {u.email ? `(${u.email})` : ""}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Manager Email</label>
              <input name="managerEmail" type="email" value={formData.managerEmail} onChange={handleChange} className={inputCls(errors, "managerEmail")} />
              <FieldError error={errors.managerEmail} />
            </div>
            <div>
              <label className={labelCls}>Manager Phone</label>
              <input name="managerPhone" type="tel" value={formData.managerPhone} onChange={handleChange} className={inputCls(errors, "managerPhone")} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Assigned Users (Ctrl+click multi)</label>
              <select
                multiple
                value={formData.assignedUserIds}
                onChange={(e) => setField("assignedUserIds", Array.from(e.target.selectedOptions, (o) => o.value))}
                className={inputCls(errors, "assignedUserIds") + " min-h-[88px]"}
              >
                {users.map((u) => <option key={u._id} value={u._id}>{u.name} ({u.email})</option>)}
              </select>
            </div>
              </div>
            </div>
            )}

            {step === 2 && (
              <div className={cardCls}>
                <div className={sectionTitleCls}>Contact Information</div>
                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Branch Email</label>
                    <input name="email" type="email" placeholder="branch@company.com" value={formData.email} onChange={handleChange} className={inputCls(errors, "email")} />
                    <FieldError error={errors.email} />
                  </div>
                  <div>
                    <label className={labelCls}>Phone</label>
                    <input name="phone" type="tel" placeholder="10-digit" value={formData.phone} onChange={handleChange} className={inputCls(errors, "phone")} />
                  </div>
                  <div>
                    <label className={labelCls}>Alternate Phone</label>
                    <input name="alternatePhone" type="tel" value={formData.alternatePhone} onChange={handleChange} className={inputCls(errors, "alternatePhone")} />
                  </div>
                  <div>
                    <label className={labelCls}>Website</label>
                    <input name="website" type="url" placeholder="https://..." value={formData.website} onChange={handleChange} className={inputCls(errors, "website")} />
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className={cardCls}>
                <div className={sectionTitleCls}>Address Details</div>
                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className={labelCls}>Address Line 1</label>
                    <input name="addressLine1" type="text" value={formData.addressLine1} onChange={handleChange} className={inputCls(errors, "addressLine1")} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelCls}>Address Line 2</label>
                    <input name="addressLine2" type="text" value={formData.addressLine2} onChange={handleChange} className={inputCls(errors, "addressLine2")} />
                  </div>
                  <div>
                    <label className={labelCls}>City (auto-fills postal code on blur)</label>
                    <input name="city" type="text" value={formData.city} onChange={handleChange} onBlur={handleCityBlur} className={inputCls(errors, "city")} placeholder="Enter city name" />
                  </div>
                  <div>
                    <label className={labelCls}>State</label>
                    <input name="state" type="text" value={formData.state} onChange={handleChange} className={inputCls(errors, "state")} />
                  </div>
                  <div>
                    <label className={labelCls}>Country</label>
                    <input name="country" type="text" value={formData.country} onChange={handleChange} className={inputCls(errors, "country")} />
                  </div>
                  <div>
                    <label className={labelCls}>Postal Code (6-digit; auto-fills city/state/country on blur)</label>
                    <input name="postalCode" type="text" value={formData.postalCode} onChange={handleChange} onBlur={handlePostalCodeBlur} className={inputCls(errors, "postalCode")} placeholder="e.g. 400001" maxLength={6} />
                  </div>
                  <div>
                    <label className={labelCls}>Latitude</label>
                    <input name="latitude" type="text" placeholder="19.0760" value={formData.latitude} onChange={handleChange} className={inputCls(errors, "latitude")} />
                  </div>
                  <div>
                    <label className={labelCls}>Longitude</label>
                    <input name="longitude" type="text" placeholder="72.8777" value={formData.longitude} onChange={handleChange} className={inputCls(errors, "longitude")} />
                  </div>
                  <div className="sm:col-span-2 pt-1">
                    <a href={`https://www.google.com/maps?q=${formData.latitude || "0"},${formData.longitude || "0"}`} target="_blank" rel="noopener noreferrer" className="text-xs text-[#0D9488] hover:underline">Open in Google Maps</a>
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className={cardCls}>
                <div className={sectionTitleCls}>Operational Details</div>
                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Opening Date</label>
                  <input name="openingDate" type="date" value={formData.openingDate} onChange={handleChange} className={inputCls(errors, "openingDate")} />
                </div>
                <div>
                  <label className={labelCls}>Working Hours</label>
                  <input name="workingHours" type="text" placeholder="9 AM - 6 PM" value={formData.workingHours} onChange={handleChange} className={inputCls(errors, "workingHours")} />
                </div>
                <div>
                  <label className={labelCls}>Timezone</label>
                  <select name="timezone" value={formData.timezone} onChange={handleChange} className={inputCls(errors, "timezone")}>
                    {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Branch Capacity</label>
                  <input name="branchCapacity" type="number" min={0} placeholder="Seats" value={formData.branchCapacity} onChange={handleChange} className={inputCls(errors, "branchCapacity")} />
                </div>
              </div>
              </div>
            )}
          </div>
        </div>

        {/* Sticky actions */}
        <div className="shrink-0 sticky bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E5E7EB] shadow-lg py-4 px-5 md:px-6">
          <div className="max-w-[1100px] mx-auto w-full flex flex-wrap items-center justify-between gap-4">
            <button type="button" onClick={() => navigate(-1)} className="px-4 py-2 rounded-lg border border-[#E5E7EB] text-[#6B7280] font-semibold hover:bg-[#F8FAFC] text-sm">
              Cancel
            </button>
            <div className="flex items-center gap-3">
              {step > 0 && (
                <button
                  type="button"
                  onClick={goBack}
                  className="px-4 py-2 rounded-lg border border-[#E5E7EB] text-[#6B7280] font-semibold hover:bg-[#F8FAFC] text-sm"
                >
                  ← Back
                </button>
              )}
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-white border border-[#E5E7EB] text-[#111827] font-semibold hover:bg-[#F8FAFC] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm text-sm"
              >
                <FiSave size={16} />
                Save Draft
              </button>
              {step < STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={goNext}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[#0D9488] text-white font-semibold hover:bg-[#0F766E] shadow-sm text-sm"
                >
                  Next →
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[#0D9488] text-white font-semibold hover:bg-[#0F766E] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm text-sm"
                >
                  {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FiSave size={16} />}
                  Submit
                </button>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
