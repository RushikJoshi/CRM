import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FiUser,
  FiMail,
  FiLock,
  FiMapPin,
  FiShield,
  FiBriefcase,
  FiTrendingUp,
  FiSettings,
  FiArrowLeft,
  FiSave,
} from "react-icons/fi";
import API from "../../services/api";
import useFormValidation, { rules } from "../../hooks/useFormValidation";
import FieldError from "../../components/FieldError";
import { useToast } from "../../context/ToastContext";
import { getCurrentUser } from "../../context/AuthContext";

const ROLES = [
  { value: "company_admin", label: "Admin" },
  { value: "branch_manager", label: "Manager" },
  { value: "sales", label: "Sales" },
  { value: "support", label: "Support" },
  { value: "marketing", label: "Marketing" },
];

const GENDERS = [
  { value: "", label: "Select" },
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

const EMPLOYMENT_TYPES = [
  { value: "", label: "Select" },
  { value: "full_time", label: "Full Time" },
  { value: "part_time", label: "Part Time" },
  { value: "contract", label: "Contract" },
];

const STATUSES = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "suspended", label: "Suspended" },
  { value: "pending", label: "Pending" },
];

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "hi", label: "Hindi" },
];

const TIMEZONES = ["Asia/Kolkata", "Asia/Dubai", "America/New_York", "Europe/London", "UTC"];

const inputCls = (errors, field) =>
  `w-full px-3 py-2 bg-white border rounded-lg text-sm text-[#111827] placeholder-[#9CA3AF] outline-none transition-all focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] ${
    errors[field] ? "border-[#EF4444]" : "border-[#E5E7EB]"
  }`;
const labelCls = "block text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-1.5";
const cardCls = "bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden";
const sectionTitleCls = "flex items-center gap-2 text-xs font-bold text-[#111827] uppercase tracking-wider px-4 py-2.5 border-b border-[#E5E7EB] bg-[#F8FAFC]";

const defaultForm = (currentUser) => ({
  firstName: "",
  lastName: "",
  displayName: "",
  profilePhotoUrl: "",
  gender: "",
  dateOfBirth: "",
  workEmail: "",
  personalEmail: "",
  phone: "",
  alternatePhone: "",
  whatsappNumber: "",
  address: "",
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
  twoFactorEnabled: false,
  role: "sales",
  department: "",
  reportingManagerId: "",
  permissionLevel: "",
  primaryBranchId: "",
  additionalBranchIds: [],
  team: "",
  territory: "",
  employeeId: "",
  jobTitle: "",
  joiningDate: "",
  employmentType: "",
  salesTarget: "",
  commissionPercentage: "",
  leadAssignmentRule: "",
  defaultPipelineId: "",
  status: "active",
  language: "en",
  timezone: "Asia/Kolkata",
  notificationPreferences: {},
  companyId: currentUser?.companyId || "",
});

export default function UserFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();
  const currentUser = getCurrentUser();
  const isSuperAdmin = currentUser?.role === "super_admin";
  const isBranchManager = currentUser?.role === "branch_manager";
  const apiBase = isSuperAdmin ? "/super-admin/users" : "/users";
  const branchesBase = isSuperAdmin ? "/super-admin/branches" : "/branches";

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [branches, setBranches] = useState([]);
  const [users, setUsers] = useState([]);
  const [pipelines, setPipelines] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [formData, setFormData] = useState(() => defaultForm(currentUser));

  const schema = {
    firstName: [rules.required("First name"), rules.minLength(1, "First name")],
    lastName: [rules.required("Last name"), rules.minLength(1, "Last name")],
    email: [rules.required("Email"), rules.email()],
    workEmail: [rules.email()],
    personalEmail: [rules.email()],
    ...(!isEdit && { password: [rules.required("Password"), rules.passwordStrength()] }),
    role: [rules.required("Role")],
    ...(!isBranchManager && { primaryBranchId: [rules.required("Primary branch")] }),
    ...(isSuperAdmin && { companyId: [rules.required("Company")] }),
  };
  const { errors, validate, clearError } = useFormValidation(schema);

  const handleChange = useCallback(
    (e) => {
      const { name, value } = e.target;
      const val = e.target.type === "checkbox" ? e.target.checked : value;
      setFormData((prev) => ({ ...prev, [name]: val }));
      clearError(name);
    },
    [clearError]
  );

  const setField = useCallback((name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    clearError(name);
  }, [clearError]);

  useEffect(() => {
    (async () => {
      try {
        const res = await API.get(branchesBase + "?limit=500");
        const data = res.data?.data || res.data?.branches || res.data || [];
        setBranches(Array.isArray(data) ? data : []);
      } catch (_) {}
    })();
  }, [branchesBase]);

  useEffect(() => {
    if (!isSuperAdmin) return;
    (async () => {
      try {
        const res = await API.get("/super-admin/companies?limit=500");
        const data = res.data?.data || res.data?.companies || res.data || [];
        setCompanies(Array.isArray(data) ? data : []);
      } catch (_) {}
    })();
  }, [isSuperAdmin]);

  useEffect(() => {
    if (!currentUser?.companyId && !isSuperAdmin) return;
    (async () => {
      try {
        const res = await API.get(apiBase + "?limit=500");
        const data = res.data?.data || res.data || [];
        setUsers(Array.isArray(data) ? data : []);
      } catch (_) {}
    })();
  }, [apiBase, isSuperAdmin, currentUser?.companyId]);

  useEffect(() => {
    (async () => {
      try {
        const res = await API.get("/pipelines?limit=100");
        const data = res.data?.data || res.data || [];
        setPipelines(Array.isArray(data) ? data : []);
      } catch (_) {}
    })();
  }, []);

  useEffect(() => {
    if (!isEdit) {
      setFetching(false);
      return;
    }
    (async () => {
      try {
        const res = await API.get(`${apiBase}/${id}`);
        const u = res.data?.data || res.data;
        if (!u) return;
        setFormData({
          ...defaultForm(currentUser),
          firstName: u.firstName || (u.name ? u.name.split(" ")[0] : ""),
          lastName: u.lastName || (u.name ? u.name.split(" ").slice(1).join(" ") : ""),
          displayName: u.displayName || "",
          profilePhotoUrl: u.profilePhotoUrl || "",
          gender: u.gender || "",
          dateOfBirth: u.dateOfBirth ? u.dateOfBirth.slice(0, 10) : "",
          workEmail: u.workEmail || u.email || "",
          personalEmail: u.personalEmail || "",
          phone: u.phone || "",
          alternatePhone: u.alternatePhone || "",
          whatsappNumber: u.whatsappNumber || "",
          address: u.address || "",
          username: u.username || "",
          email: u.email || "",
          twoFactorEnabled: u.twoFactorEnabled || false,
          role: u.role || "sales",
          department: u.department || "",
          reportingManagerId: u.reportingManagerId?._id || u.reportingManagerId || "",
          permissionLevel: u.permissionLevel || "",
          primaryBranchId: u.primaryBranchId?._id || u.branchId?._id || u.branchId || u.primaryBranchId || "",
          additionalBranchIds: Array.isArray(u.additionalBranchIds) ? u.additionalBranchIds.map((b) => b?._id || b) : [],
          team: u.team || "",
          territory: u.territory || "",
          employeeId: u.employeeId || "",
          jobTitle: u.jobTitle || "",
          joiningDate: u.joiningDate ? u.joiningDate.slice(0, 10) : "",
          employmentType: u.employmentType || "",
          salesTarget: u.salesTarget != null ? String(u.salesTarget) : "",
          commissionPercentage: u.commissionPercentage != null ? String(u.commissionPercentage) : "",
          leadAssignmentRule: u.leadAssignmentRule || "",
          defaultPipelineId: u.defaultPipelineId?._id || u.defaultPipelineId || "",
          status: u.status || "active",
          language: u.language || "en",
          timezone: u.timezone || "Asia/Kolkata",
          companyId: u.companyId?._id || u.companyId || currentUser?.companyId || "",
        });
      } catch (_) {
        toast.error("Failed to load user");
      } finally {
        setFetching(false);
      }
    })();
  }, [id, isEdit, apiBase]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password && formData.password !== formData.confirmPassword) {
      toast.error("Password and Confirm Password do not match.");
      return;
    }
    if (!validate(formData)) {
      toast.error("Please fix the errors before saving.");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...formData,
        name: formData.displayName?.trim() || [formData.firstName, formData.lastName].filter(Boolean).join(" ").trim() || formData.email,
        workEmail: formData.workEmail?.trim() || formData.email?.trim(),
        primaryBranchId: formData.primaryBranchId || undefined,
        branchId: formData.primaryBranchId || undefined,
        additionalBranchIds: (formData.additionalBranchIds || []).filter(Boolean),
        joiningDate: formData.joiningDate || undefined,
        dateOfBirth: formData.dateOfBirth || undefined,
        salesTarget: formData.salesTarget ? Number(formData.salesTarget) : undefined,
        commissionPercentage: formData.commissionPercentage ? Number(formData.commissionPercentage) : undefined,
        defaultPipelineId: formData.defaultPipelineId || undefined,
        reportingManagerId: formData.reportingManagerId || undefined,
      };
      delete payload.confirmPassword;
      if (isEdit && !payload.password) delete payload.password;
      if (isBranchManager) {
        delete payload.primaryBranchId;
        delete payload.branchId;
        delete payload.additionalBranchIds;
      }
      if (isEdit) {
        await API.put(`${apiBase}/${id}`, payload);
        toast.success("User updated successfully.");
      } else {
        await API.post(apiBase, payload);
        toast.success("User created successfully.");
      }
      navigate(-1);
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-[#E5E7EB] border-t-[#2563EB] rounded-full animate-spin" />
        <p className="text-sm text-[#6B7280]">Loading user...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-6rem)]">
      <div className="shrink-0 flex items-center justify-between gap-4 px-4 py-3 bg-white border-b border-[#E5E7EB]">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm font-semibold text-[#6B7280] hover:text-[#111827]">
            <FiArrowLeft size={16} /> Back
          </button>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
              <FiUser size={18} />
            </div>
            <div>
              <h1 className="text-base font-bold text-[#111827]">{isEdit ? "Edit User" : "Create User"}</h1>
              <p className="text-[10px] text-[#6B7280]">{isEdit ? "Update user details" : "Add new user"}</p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex-1 min-h-0 overflow-auto pb-4">
        <div className="p-4 md:p-5 grid grid-cols-1 xl:grid-cols-2 gap-5 xl:gap-6 max-w-[1600px] mx-auto">
          {/* Left column */}
          <div className="space-y-4">
            {/* 1. Personal Information */}
            <div className={cardCls}>
              <div className={sectionTitleCls}>
                <FiUser className="text-[#2563EB]" size={14} /> Personal Information
              </div>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>First Name <span className="text-red-500">*</span></label>
                  <input name="firstName" value={formData.firstName} onChange={handleChange} className={inputCls(errors, "firstName")} placeholder="First name" />
                  <FieldError error={errors.firstName} />
                </div>
                <div>
                  <label className={labelCls}>Last Name <span className="text-red-500">*</span></label>
                  <input name="lastName" value={formData.lastName} onChange={handleChange} className={inputCls(errors, "lastName")} placeholder="Last name" />
                  <FieldError error={errors.lastName} />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Display Name</label>
                  <input name="displayName" value={formData.displayName} onChange={handleChange} className={inputCls(errors, "displayName")} placeholder="Display name" />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Profile Photo URL</label>
                  <input name="profilePhotoUrl" type="url" value={formData.profilePhotoUrl} onChange={handleChange} className={inputCls(errors, "profilePhotoUrl")} placeholder="https://..." />
                </div>
                <div>
                  <label className={labelCls}>Gender</label>
                  <select name="gender" value={formData.gender} onChange={handleChange} className={inputCls(errors, "gender")}>
                    {GENDERS.map((g) => <option key={g.value || "x"} value={g.value}>{g.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Date of Birth</label>
                  <input name="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={handleChange} className={inputCls(errors, "dateOfBirth")} />
                </div>
              </div>
            </div>

            {/* 2. Contact Information */}
            <div className={cardCls}>
              <div className={sectionTitleCls}>
                <FiMail className="text-[#2563EB]" size={14} /> Contact Information
              </div>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className={labelCls}>Work Email <span className="text-red-500">*</span></label>
                  <input name="workEmail" type="email" value={formData.workEmail} onChange={handleChange} className={inputCls(errors, "workEmail")} placeholder="work@company.com" />
                  <FieldError error={errors.workEmail} />
                </div>
                <div>
                  <label className={labelCls}>Personal Email</label>
                  <input name="personalEmail" type="email" value={formData.personalEmail} onChange={handleChange} className={inputCls(errors, "personalEmail")} placeholder="personal@email.com" />
                  <FieldError error={errors.personalEmail} />
                </div>
                <div>
                  <label className={labelCls}>Phone</label>
                  <input name="phone" type="tel" value={formData.phone} onChange={handleChange} className={inputCls(errors, "phone")} placeholder="10-digit" />
                </div>
                <div>
                  <label className={labelCls}>Alternate Phone</label>
                  <input name="alternatePhone" type="tel" value={formData.alternatePhone} onChange={handleChange} className={inputCls(errors, "alternatePhone")} />
                </div>
                <div>
                  <label className={labelCls}>WhatsApp Number</label>
                  <input name="whatsappNumber" type="tel" value={formData.whatsappNumber} onChange={handleChange} className={inputCls(errors, "whatsappNumber")} />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Address</label>
                  <input name="address" value={formData.address} onChange={handleChange} className={inputCls(errors, "address")} placeholder="Full address" />
                </div>
              </div>
            </div>

            {/* 3. Login Information */}
            <div className={cardCls}>
              <div className={sectionTitleCls}>
                <FiLock className="text-[#2563EB]" size={14} /> Login Information
              </div>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Username</label>
                  <input name="username" value={formData.username} onChange={handleChange} className={inputCls(errors, "username")} placeholder="Login username" />
                </div>
                <div>
                  <label className={labelCls}>Email (login) <span className="text-red-500">*</span></label>
                  <input name="email" type="email" value={formData.email} onChange={handleChange} className={inputCls(errors, "email")} placeholder="Login email" />
                  <FieldError error={errors.email} />
                </div>
                <div>
                  <label className={labelCls}>Password {!isEdit && <span className="text-red-500">*</span>}</label>
                  <input name="password" type="password" value={formData.password} onChange={handleChange} className={inputCls(errors, "password")} placeholder={isEdit ? "Leave blank to keep" : "Min 8 characters"} autoComplete="new-password" />
                  <FieldError error={errors.password} />
                </div>
                <div>
                  <label className={labelCls}>Confirm Password</label>
                  <input name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} className={inputCls(errors, "confirmPassword")} placeholder="Re-enter password" autoComplete="new-password" />
                </div>
                <div className="sm:col-span-2 flex items-center gap-2">
                  <input type="checkbox" id="twoFactor" name="twoFactorEnabled" checked={formData.twoFactorEnabled} onChange={handleChange} className="rounded border-[#E5E7EB]" />
                  <label htmlFor="twoFactor" className="text-sm font-medium text-[#374151]">Two-Factor Authentication</label>
                </div>
              </div>
            </div>

            {/* 4. Role & Permissions */}
            <div className={cardCls}>
              <div className={sectionTitleCls}>
                <FiShield className="text-[#2563EB]" size={14} /> Role & Permissions
              </div>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>User Role <span className="text-red-500">*</span></label>
                  <select name="role" value={formData.role} onChange={handleChange} className={inputCls(errors, "role")} disabled={isBranchManager}>
                    {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                  <FieldError error={errors.role} />
                </div>
                <div>
                  <label className={labelCls}>Department</label>
                  <input name="department" value={formData.department} onChange={handleChange} className={inputCls(errors, "department")} placeholder="e.g. Sales" />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Reporting Manager</label>
                  <select name="reportingManagerId" value={formData.reportingManagerId} onChange={handleChange} className={inputCls(errors, "reportingManagerId")}>
                    <option value="">Select manager...</option>
                    {users.filter((u) => u._id !== id).map((u) => <option key={u._id} value={u._id}>{u.name} {u.email ? `(${u.email})` : ""}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Permission Level</label>
                  <input name="permissionLevel" value={formData.permissionLevel} onChange={handleChange} className={inputCls(errors, "permissionLevel")} placeholder="e.g. Standard" />
                </div>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            {/* 5. Branch Assignment */}
            <div className={cardCls}>
              <div className={sectionTitleCls}>
                <FiMapPin className="text-[#2563EB]" size={14} /> Branch Assignment
              </div>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  <label className={labelCls}>Primary Branch {!isBranchManager && <span className="text-red-500">*</span>}</label>
                  <select name="primaryBranchId" value={formData.primaryBranchId} onChange={handleChange} className={inputCls(errors, "primaryBranchId")} disabled={isBranchManager}>
                    <option value="">Select branch...</option>
                    {branches.map((b) => <option key={b._id} value={b._id}>{b.name} {b.branchCode ? `(${b.branchCode})` : ""}</option>)}
                  </select>
                  <FieldError error={errors.primaryBranchId} />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Additional Branch Access (Ctrl+click multi)</label>
                  <select
                    multiple
                    value={formData.additionalBranchIds}
                    onChange={(e) => setField("additionalBranchIds", Array.from(e.target.selectedOptions, (o) => o.value))}
                    className={inputCls(errors, "additionalBranchIds") + " min-h-[80px]"}
                    disabled={isBranchManager}
                  >
                    {branches.filter((b) => b._id !== formData.primaryBranchId).map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Team</label>
                  <input name="team" value={formData.team} onChange={handleChange} className={inputCls(errors, "team")} placeholder="Team name" />
                </div>
                <div>
                  <label className={labelCls}>Territory</label>
                  <input name="territory" value={formData.territory} onChange={handleChange} className={inputCls(errors, "territory")} placeholder="Territory" />
                </div>
              </div>
            </div>

            {/* 6. Work Information */}
            <div className={cardCls}>
              <div className={sectionTitleCls}>
                <FiBriefcase className="text-[#2563EB]" size={14} /> Work Information
              </div>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Employee ID</label>
                  <input name="employeeId" value={formData.employeeId} onChange={handleChange} className={inputCls(errors, "employeeId")} placeholder="EMP-001" />
                </div>
                <div>
                  <label className={labelCls}>Job Title</label>
                  <input name="jobTitle" value={formData.jobTitle} onChange={handleChange} className={inputCls(errors, "jobTitle")} placeholder="e.g. Sales Rep" />
                </div>
                <div>
                  <label className={labelCls}>Joining Date</label>
                  <input name="joiningDate" type="date" value={formData.joiningDate} onChange={handleChange} className={inputCls(errors, "joiningDate")} />
                </div>
                <div>
                  <label className={labelCls}>Employment Type</label>
                  <select name="employmentType" value={formData.employmentType} onChange={handleChange} className={inputCls(errors, "employmentType")}>
                    {EMPLOYMENT_TYPES.map((e) => <option key={e.value || "x"} value={e.value}>{e.label}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* 7. CRM Sales Settings */}
            <div className={cardCls}>
              <div className={sectionTitleCls}>
                <FiTrendingUp className="text-[#2563EB]" size={14} /> CRM Sales Settings
              </div>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Sales Target</label>
                  <input name="salesTarget" type="number" min={0} value={formData.salesTarget} onChange={handleChange} className={inputCls(errors, "salesTarget")} placeholder="Amount" />
                </div>
                <div>
                  <label className={labelCls}>Commission %</label>
                  <input name="commissionPercentage" type="number" min={0} max={100} step={0.01} value={formData.commissionPercentage} onChange={handleChange} className={inputCls(errors, "commissionPercentage")} placeholder="%" />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Lead Assignment Rule</label>
                  <input name="leadAssignmentRule" value={formData.leadAssignmentRule} onChange={handleChange} className={inputCls(errors, "leadAssignmentRule")} placeholder="Rule name" />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Default Pipeline</label>
                  <select name="defaultPipelineId" value={formData.defaultPipelineId} onChange={handleChange} className={inputCls(errors, "defaultPipelineId")}>
                    <option value="">Select pipeline...</option>
                    {pipelines.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* 8. Account Settings */}
            <div className={cardCls}>
              <div className={sectionTitleCls}>
                <FiSettings className="text-[#2563EB]" size={14} /> Account Settings
              </div>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Account Status</label>
                  <select name="status" value={formData.status} onChange={handleChange} className={inputCls(errors, "status")}>
                    {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Language</label>
                  <select name="language" value={formData.language} onChange={handleChange} className={inputCls(errors, "language")}>
                    {LANGUAGES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Timezone</label>
                  <select name="timezone" value={formData.timezone} onChange={handleChange} className={inputCls(errors, "timezone")}>
                    {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="shrink-0 sticky bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E5E7EB] shadow-lg py-4 px-5 md:px-6">
          <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-4">
            <button type="button" onClick={() => navigate(-1)} className="px-4 py-2 rounded-lg border border-[#E5E7EB] text-[#6B7280] font-semibold hover:bg-[#F8FAFC] text-sm">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[#2563EB] text-white font-semibold hover:bg-[#1D4ED8] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm text-sm"
            >
              {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FiSave size={16} />}
              {isEdit ? "Update User" : "Save User"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
