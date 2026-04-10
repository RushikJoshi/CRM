import React, { useMemo, useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
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
import CitySelect from "../../components/CitySelect";
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
const labelCls = "block text-sm font-medium text-[#6B7280] mb-1.5";
const cardCls = "bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden";
const sectionTitleCls = "flex items-center gap-2 text-sm font-semibold text-[#111827] px-5 py-4 border-b border-[#E5E7EB] bg-[#F8FAFC]";
const requiredNumberRule = (label) => (value) => {
  const raw = String(value ?? "").trim();
  if (!raw) return `${label} is required`;
  const n = Number(raw);
  if (!Number.isFinite(n)) return `${label} must be a valid number`;
  if (n < 0) return `${label} cannot be negative`;
  return null;
};
const commissionRule = (value) => {
  const raw = String(value ?? "").trim();
  if (!raw) return "Commission % is required";
  const n = Number(raw);
  if (!Number.isFinite(n)) return "Commission % must be a valid number";
  if (n < 0 || n > 100) return "Commission % must be between 0 and 100";
  return null;
};
const passwordStrengthRule = (value) => {
  if (!String(value || "").trim()) return "Password is required";
  if (String(value).length < 8) return "Password must be at least 8 characters";
  return null;
};

const defaultForm = (currentUser) => ({
  firstName: "",
  lastName: "",
  displayName: "",
  gender: "",
  dateOfBirth: "",
  workEmail: "",
  personalEmail: "",
  phone: "",
  alternatePhone: "",
  whatsappNumber: "",
  address: "",
  cityId: "",
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

const STEPS = [
  { key: "step1", label: "Personal + Contact", icon: <FiUser size={14} className="text-[#2563EB]" /> },
  { key: "step2", label: "Branch + Work", icon: <FiMapPin size={14} className="text-[#2563EB]" /> },
  { key: "step3", label: "CRM + Login", icon: <FiTrendingUp size={14} className="text-[#2563EB]" /> },
  { key: "step4", label: "Role + Account", icon: <FiShield size={14} className="text-[#2563EB]" /> },
];

export default function UserFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isView = searchParams.get("mode") === "view";
  const toast = useToast();
  const currentUser = getCurrentUser();
  const currentCompanyId = currentUser?.companyId || "";
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
  const [step, setStep] = useState(0);
  const [isStepChanging, setIsStepChanging] = useState(false);

  const fullSchema = useMemo(() => ({
    firstName: [rules.required("First name")],
    lastName: [rules.required("Last name")],
    displayName: [rules.required("Display name")],
    gender: [rules.required("Gender")],
    dateOfBirth: [rules.required("Date of birth")],
    workEmail: [rules.required("Work email"), rules.email()],
    personalEmail: [rules.required("Personal email"), rules.email()],
    phone: [rules.required("Phone"), rules.phone()],
    alternatePhone: [rules.required("Alternate phone"), rules.phone()],
    whatsappNumber: [rules.required("WhatsApp number"), rules.phone()],
    address: [rules.required("Address")],
    cityId: [rules.required("City")],
    primaryBranchId: [rules.required("Primary branch")],
    employeeId: [rules.required("Employee ID")],
    jobTitle: [rules.required("Job title")],
    joiningDate: [rules.required("Joining date")],
    employmentType: [rules.required("Employment type")],
    salesTarget: [requiredNumberRule("Sales target")],
    commissionPercentage: [commissionRule],
    leadAssignmentRule: [rules.required("Lead assignment rule")],
    defaultPipelineId: [rules.required("Default pipeline")],
    username: [rules.required("Username")],
    email: [rules.required("Email"), rules.email()],
    password: [passwordStrengthRule],
    confirmPassword: [
      (value) => {
        if (!String(formData.password || "").trim()) return null;
        if (!String(value || "").trim()) return "Confirm password is required";
        if (value !== formData.password) return "Password and Confirm Password do not match";
        return null;
      },
    ],
    role: [rules.required("Role")],
    department: [rules.required("Department")],
    reportingManagerId: [rules.required("Reporting manager")],
    permissionLevel: [rules.required("Permission level")],
    status: [rules.required("Status")],
    language: [rules.required("Language")],
    timezone: [rules.required("Timezone")],
    ...(isSuperAdmin && { companyId: [rules.required("Company")] }),
  }), [isSuperAdmin, formData.password]);

  const getStepSchema = useCallback((stepIndex) => {
    switch (stepIndex) {
      case 0:
        return {
          firstName: fullSchema.firstName,
          lastName: fullSchema.lastName,
          displayName: fullSchema.displayName,
          gender: fullSchema.gender,
          dateOfBirth: fullSchema.dateOfBirth,
          workEmail: fullSchema.workEmail,
          personalEmail: fullSchema.personalEmail,
          phone: fullSchema.phone,
          alternatePhone: fullSchema.alternatePhone,
          whatsappNumber: fullSchema.whatsappNumber,
          address: fullSchema.address,
          cityId: fullSchema.cityId,
        };
      case 1:
        return {
          ...(isSuperAdmin ? { companyId: fullSchema.companyId } : {}),
          ...(!isBranchManager ? { primaryBranchId: fullSchema.primaryBranchId } : {}),
          employeeId: fullSchema.employeeId,
          jobTitle: fullSchema.jobTitle,
          joiningDate: fullSchema.joiningDate,
          employmentType: fullSchema.employmentType,
        };
      case 2:
        return {
          salesTarget: fullSchema.salesTarget,
          commissionPercentage: fullSchema.commissionPercentage,
          leadAssignmentRule: fullSchema.leadAssignmentRule,
          defaultPipelineId: fullSchema.defaultPipelineId,
          username: fullSchema.username,
          email: fullSchema.email,
          ...(!isEdit || String(formData.password || "").trim()
            ? { password: fullSchema.password, confirmPassword: fullSchema.confirmPassword }
            : {}),
        };
      case 3:
        return {
          role: fullSchema.role,
          department: fullSchema.department,
          reportingManagerId: fullSchema.reportingManagerId,
          permissionLevel: fullSchema.permissionLevel,
          status: fullSchema.status,
          language: fullSchema.language,
          timezone: fullSchema.timezone,
        };
      default:
        return {};
    }
  }, [fullSchema, isSuperAdmin, isEdit, isBranchManager, formData.password]);

  const stepSchema = useMemo(() => getStepSchema(step), [getStepSchema, step]);

  const { errors, validate, clearError, clearAllErrors } = useFormValidation(stepSchema);

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
    clearAllErrors?.();
  }, [step, clearAllErrors]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await API.get(branchesBase + "?limit=500");
        const data = res.data?.data || res.data?.branches || res.data || [];
        if (active) setBranches(Array.isArray(data) ? data : []);
      } catch (err) {
        if (err.response?.status === 429) {
          console.error("Rate limit hit during branch fetch");
        }
      }
    })();
    return () => { active = false; };
  }, [branchesBase]);

  useEffect(() => {
    if (!isSuperAdmin) return;
    let active = true;
    (async () => {
      try {
        const res = await API.get("/super-admin/companies?limit=500");
        const data = res.data?.data || res.data?.companies || res.data || [];
        if (active) setCompanies(Array.isArray(data) ? data : []);
      } catch (_) {}
    })();
    return () => { active = false; };
  }, [isSuperAdmin]);

  const memoizedId = isSuperAdmin ? (currentUser?.companyId || "sa") : "na";
  useEffect(() => {
    if (!currentUser?.companyId && !isSuperAdmin) return;
    let active = true;
    (async () => {
      try {
        const res = await API.get(apiBase + "?limit=500");
        const data = res.data?.data || res.data || [];
        if (active) setUsers(Array.isArray(data) ? data : []);
      } catch (_) {}
    })();
    return () => { active = false; };
  }, [apiBase, isSuperAdmin, memoizedId]);

  useEffect(() => {
    if (isSuperAdmin) return; // Super admin doesn't have a company pipeline
    let active = true;
    (async () => {
      try {
        // ONE PIPELINE PER COMPANY — GET /pipeline returns a single object
        const res = await API.get("/pipeline");
        const pl = res.data?.data;
        if (active) setPipelines(pl ? [pl] : []); // Wrap in array for the select dropdown
      } catch (_) {
        if (active) setPipelines([]);
      }
    })();
    return () => { active = false; };
  }, [isSuperAdmin]);

  useEffect(() => {
    if (!isEdit) {
      setFetching(false);
      return;
    }
    let active = true;
    (async () => {
      try {
        const res = await API.get(`${apiBase}/${id}`);
        const u = res.data?.data || res.data;
        if (!u || !active) return;
        setFormData({
          ...defaultForm(currentUser),
          firstName: u.firstName || (u.name ? u.name.split(" ")[0] : ""),
          lastName: u.lastName || (u.name ? u.name.split(" ").slice(1).join(" ") : ""),
          displayName: u.displayName || "",
          gender: u.gender || "",
          dateOfBirth: u.dateOfBirth ? u.dateOfBirth.slice(0, 10) : "",
          workEmail: u.workEmail || u.email || "",
          personalEmail: u.personalEmail || "",
          phone: u.phone || "",
          alternatePhone: u.alternatePhone || "",
          whatsappNumber: u.whatsappNumber || "",
          address: u.address || "",
          cityId: u.cityId?._id || u.cityId || "",
          username: u.username || "",
          email: u.email || "",
          twoFactorEnabled: u.twoFactorEnabled || false,
          role: u.role || "sales",
          department: u.department || "",
          reportingManagerId: u.reportingManagerId?._id || u.reportingManagerId || "",
          permissionLevel: u.permissionLevel || "",
          primaryBranchId: u.primaryBranchId?._id || u.branchId?._id || u.branchId || u.primaryBranchId || "",
          additionalBranchIds: Array.isArray(u.additionalBranchIds) ? u.additionalBranchIds.map((b) => b?._id || b) : [],
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
          companyId: u.companyId?._id || u.companyId || currentCompanyId || "",
        });
        setStep(0);
      } catch (_) {
        if (active) toast.error("Failed to load user");
      } finally {
        if (active) setFetching(false);
      }
    })();
    return () => { active = false; };
  }, [id, isEdit, apiBase, currentCompanyId]);

  const buildPayload = (statusOverride) => {
    const payload = {
      ...formData,
      ...(statusOverride ? { status: statusOverride } : null),
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
    return payload;
  };

  const canSaveDraft = () => {
    const email = (formData.email || formData.workEmail || "").trim();
    if (!email) return false;
    return true;
  };

  const handleSaveDraft = async () => {
    if (isView) return;
    if (!canSaveDraft()) {
      toast.error("Please enter Email (login) or Work Email to save a draft.");
      return;
    }
    setLoading(true);
    try {
      const payload = buildPayload("draft");
      if (isEdit) {
        await API.put(`${apiBase}/${id}`, payload);
        toast.success("Draft saved.");
      } else {
        await API.post(apiBase, payload);
        toast.success("Draft saved.");
      }
      navigate(-1);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save draft.");
    } finally {
      setLoading(false);
    }
  };

  const canGoNext = async () => validate(formData);

  const goNext = async () => {
    console.info("UserForm: Navigating from Step Index", step, "to", step + 1);
    const valid = await canGoNext();
    if (!valid) {
      toast.error("Please fix the errors before continuing.");
      return;
    }
    setIsStepChanging(true);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    setTimeout(() => setIsStepChanging(false), 500);
  };

  const firstInvalidStep = useCallback(() => {
    for (let index = 0; index < STEPS.length; index += 1) {
      const schema = getStepSchema(index);
      for (const field of Object.keys(schema)) {
        const fieldRules = schema[field] || [];
        for (const rule of fieldRules) {
          if (rule(formData[field])) return index;
        }
      }
    }
    return -1;
  }, [getStepSchema, formData]);

  const handleStepClick = async (targetStep) => {
    if (targetStep <= step) {
      setStep(targetStep);
      return;
    }
    if (isView) {
      setStep(targetStep);
      return;
    }
    const valid = await validate(formData);
    if (!valid) {
      toast.error("Please fix the errors before continuing.");
      return;
    }
    setStep(targetStep);
  };

  const goBack = () => setStep((s) => Math.max(0, s - 1));

  const handleKeyDown = (e) => {
    // Only allow "Enter" to submit on the final step to prevent premature creation
    if (e.key === "Enter") {
      if (step < STEPS.length - 1) {
        e.preventDefault();
        goNext();
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.info("handleSubmit triggered at User Step:", step + 1);

    // CRITICAL: Block any API submission unless the user is on the VERY LAST step (Index 3)
    if (step < STEPS.length - 1) {
      console.warn("Blocked premature submission attempt from Step:", step + 1);
      goNext();
      return;
    }

    console.log("Final submission initiated at User Step 4 (Role & Account).");

    if (isView) return;

    const invalidStep = firstInvalidStep();
    if (invalidStep !== -1) {
      setStep(invalidStep);
      toast.error("Please fill all required fields before saving.");
      return;
    }
    setLoading(true);
    try {
      const payload = buildPayload();
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
              <h1 className="text-base font-bold text-[#111827]">{isView ? "View User" : (isEdit ? "Edit User" : "Create User")}</h1>
              <p className="text-[10px] text-[#6B7280]">{isView ? "Read-only details" : (isEdit ? "Update user details" : "Add new user")}</p>
            </div>
          </div>
        </div>
      </div>

      <form id="user-form" onSubmit={handleSubmit} onKeyDown={handleKeyDown} noValidate className="flex-1 min-h-0 overflow-auto pb-4">
        <div className="p-4 md:p-6 w-full">
          <div className="max-w-[1100px] mx-auto space-y-6">
          <div className="mb-4 bg-white rounded-xl border border-[#E5E7EB] shadow-sm px-3 py-2.5">
            <div className="flex flex-wrap items-center gap-2">
              {STEPS.map((s, idx) => {
                const active = idx === step;
                const done = idx < step;
                return (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => handleStepClick(idx)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                      active ? "bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]" : done ? "bg-white text-[#111827] border-[#E5E7EB] hover:bg-[#F8FAFC]" : "bg-white text-[#6B7280] border-[#E5E7EB] hover:bg-[#F8FAFC]"
                    }`}
                    title={s.label}
                  >
                    {s.icon}
                    <span className="hidden sm:inline">{idx + 1}. {s.label}</span>
                    <span className="sm:hidden">{idx + 1}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Step 1: Personal + Contact */}
            {step === 0 && (
              <>
                <div className={cardCls}>
                  <div className={sectionTitleCls}>
                    <FiUser className="text-[#2563EB]" size={14} /> Personal Information
                  </div>
                  <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>First Name <span className="text-red-500">*</span></label>
                      <input name="firstName" value={formData.firstName} onChange={handleChange} disabled={isView} className={inputCls(errors, "firstName")} placeholder="First name" />
                      <FieldError error={errors.firstName} />
                    </div>
                    <div>
                      <label className={labelCls}>Last Name <span className="text-red-500">*</span></label>
                      <input name="lastName" value={formData.lastName} onChange={handleChange} disabled={isView} className={inputCls(errors, "lastName")} placeholder="Last name" />
                      <FieldError error={errors.lastName} />
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelCls}>Display Name</label>
                      <input name="displayName" value={formData.displayName} onChange={handleChange} disabled={isView} className={inputCls(errors, "displayName")} placeholder="Display name" />
                      <FieldError error={errors.displayName} />
                    </div>
                    <div>
                      <label className={labelCls}>Gender</label>
                      <select name="gender" value={formData.gender} onChange={handleChange} disabled={isView} className={inputCls(errors, "gender")}>
                        {GENDERS.map((g) => <option key={g.value || "x"} value={g.value}>{g.label}</option>)}
                      </select>
                      <FieldError error={errors.gender} />
                    </div>
                    <div>
                      <label className={labelCls}>Date of Birth</label>
                      <input name="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={handleChange} disabled={isView} className={inputCls(errors, "dateOfBirth")} />
                      <FieldError error={errors.dateOfBirth} />
                    </div>
                  </div>
                </div>

                <div className={cardCls}>
                  <div className={sectionTitleCls}>
                    <FiMail className="text-[#2563EB]" size={14} /> Contact Information
                  </div>
                  <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className={labelCls}>Work Email <span className="text-red-500">*</span></label>
                      <input name="workEmail" type="email" value={formData.workEmail} onChange={handleChange} disabled={isView} className={inputCls(errors, "workEmail")} placeholder="work@company.com" />
                      <FieldError error={errors.workEmail} />
                    </div>
                    <div>
                      <label className={labelCls}>Personal Email</label>
                      <input name="personalEmail" type="email" value={formData.personalEmail} onChange={handleChange} disabled={isView} className={inputCls(errors, "personalEmail")} placeholder="personal@email.com" />
                      <FieldError error={errors.personalEmail} />
                    </div>
                    <div>
                      <label className={labelCls}>Phone</label>
                      <input name="phone" type="tel" value={formData.phone} onChange={handleChange} disabled={isView} className={inputCls(errors, "phone")} placeholder="10-digit" />
                      <FieldError error={errors.phone} />
                    </div>
                    <div>
                      <label className={labelCls}>Alternate Phone</label>
                      <input name="alternatePhone" type="tel" value={formData.alternatePhone} onChange={handleChange} disabled={isView} className={inputCls(errors, "alternatePhone")} />
                      <FieldError error={errors.alternatePhone} />
                    </div>
                    <div>
                      <label className={labelCls}>WhatsApp Number</label>
                      <input name="whatsappNumber" type="tel" value={formData.whatsappNumber} onChange={handleChange} disabled={isView} className={inputCls(errors, "whatsappNumber")} />
                      <FieldError error={errors.whatsappNumber} />
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelCls}>Address</label>
                      <input name="address" value={formData.address} onChange={handleChange} disabled={isView} className={inputCls(errors, "address")} placeholder="Full address" />
                      <FieldError error={errors.address} />
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelCls}>City</label>
                      <CitySelect 
                        value={formData.cityId} 
                        onChange={(id) => setField("cityId", id)} 
                        disabled={isView}
                        error={errors.cityId}
                      />
                      <FieldError error={errors.cityId} />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Step 2: Branch + Work */}
            {step === 1 && (
              <>
                <div className={cardCls}>
                  <div className={sectionTitleCls}>
                    <FiMapPin className="text-[#2563EB]" size={14} /> Branch Assignment
                  </div>
                  <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {isSuperAdmin && (
                      <div className="md:col-span-2">
                        <label className={labelCls}>Company <span className="text-red-500">*</span></label>
                        <select name="companyId" value={formData.companyId} onChange={handleChange} disabled={isView} className={inputCls(errors, "companyId")}>
                          <option value="">Select company...</option>
                          {companies.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                        </select>
                        <FieldError error={errors.companyId} />
                      </div>
                    )}
                    <div className="md:col-span-2">
                      <label className={labelCls}>Primary Branch {!isBranchManager && <span className="text-red-500">*</span>}</label>
                      <select name="primaryBranchId" value={formData.primaryBranchId} onChange={handleChange} className={inputCls(errors, "primaryBranchId")} disabled={isView || isBranchManager}>
                        <option value="">Select branch...</option>
                        {branches.map((b) => <option key={b._id} value={b._id}>{b.name} {b.branchCode ? `(${b.branchCode})` : ""}</option>)}
                      </select>
                      <FieldError error={errors.primaryBranchId} />
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelCls}>Additional Branch Access (Ctrl+click multi)</label>
                      <select
                        multiple
                        value={formData.additionalBranchIds}
                        onChange={(e) => setField("additionalBranchIds", Array.from(e.target.selectedOptions, (o) => o.value))}
                        className={inputCls(errors, "additionalBranchIds") + " min-h-[80px]"}
                        disabled={isView || isBranchManager}
                      >
                        {branches.filter((b) => b._id !== formData.primaryBranchId).map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <div className={cardCls}>
                  <div className={sectionTitleCls}>
                    <FiBriefcase className="text-[#2563EB]" size={14} /> Work Information
                  </div>
                  <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Employee ID</label>
                      <input name="employeeId" value={formData.employeeId} onChange={handleChange} disabled={isView} className={inputCls(errors, "employeeId")} placeholder="EMP-001" />
                      <FieldError error={errors.employeeId} />
                    </div>
                    <div>
                      <label className={labelCls}>Job Title</label>
                      <input name="jobTitle" value={formData.jobTitle} onChange={handleChange} disabled={isView} className={inputCls(errors, "jobTitle")} placeholder="e.g. Sales Rep" />
                      <FieldError error={errors.jobTitle} />
                    </div>
                    <div>
                      <label className={labelCls}>Joining Date</label>
                      <input name="joiningDate" type="date" value={formData.joiningDate} onChange={handleChange} disabled={isView} className={inputCls(errors, "joiningDate")} />
                      <FieldError error={errors.joiningDate} />
                    </div>
                    <div>
                      <label className={labelCls}>Employment Type</label>
                      <select name="employmentType" value={formData.employmentType} onChange={handleChange} disabled={isView} className={inputCls(errors, "employmentType")}>
                        {EMPLOYMENT_TYPES.map((e) => <option key={e.value || "x"} value={e.value}>{e.label}</option>)}
                      </select>
                      <FieldError error={errors.employmentType} />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Step 3: CRM + Login */}
            {step === 2 && (
              <>
                <div className={cardCls}>
                  <div className={sectionTitleCls}>
                    <FiTrendingUp className="text-[#2563EB]" size={14} /> CRM Sales Settings
                  </div>
                  <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Sales Target</label>
                      <input name="salesTarget" type="number" min={0} value={formData.salesTarget} onChange={handleChange} disabled={isView} className={inputCls(errors, "salesTarget")} placeholder="Amount" />
                      <FieldError error={errors.salesTarget} />
                    </div>
                    <div>
                      <label className={labelCls}>Commission %</label>
                      <input name="commissionPercentage" type="number" min={0} max={100} step={0.01} value={formData.commissionPercentage} onChange={handleChange} disabled={isView} className={inputCls(errors, "commissionPercentage")} placeholder="%" />
                      <FieldError error={errors.commissionPercentage} />
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelCls}>Lead Assignment Rule</label>
                      <input name="leadAssignmentRule" value={formData.leadAssignmentRule} onChange={handleChange} disabled={isView} className={inputCls(errors, "leadAssignmentRule")} placeholder="Rule name" />
                      <FieldError error={errors.leadAssignmentRule} />
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelCls}>Default Pipeline</label>
                      <select name="defaultPipelineId" value={formData.defaultPipelineId} onChange={handleChange} disabled={isView} className={inputCls(errors, "defaultPipelineId")}>
                        <option value="">Select pipeline...</option>
                        {pipelines.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
                      </select>
                      <FieldError error={errors.defaultPipelineId} />
                    </div>
                  </div>
                </div>

                <div className={cardCls}>
                  <div className={sectionTitleCls}>
                    <FiLock className="text-[#2563EB]" size={14} /> Login Information
                  </div>
                  <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Username</label>
                      <input name="username" value={formData.username} onChange={handleChange} disabled={isView} className={inputCls(errors, "username")} placeholder="Login username" />
                      <FieldError error={errors.username} />
                    </div>
                    <div>
                      <label className={labelCls}>Email (login) <span className="text-red-500">*</span></label>
                      <input name="email" type="email" value={formData.email} onChange={handleChange} disabled={isView} className={inputCls(errors, "email")} placeholder="Login email" />
                      <FieldError error={errors.email} />
                    </div>
                    <div>
                      <label className={labelCls}>Password {!isEdit && <span className="text-red-500">*</span>}</label>
                      <input name="password" type="password" value={formData.password} onChange={handleChange} disabled={isView} className={inputCls(errors, "password")} placeholder={isEdit ? "Leave blank to keep" : "Min 8 characters"} autoComplete="new-password" />
                      <FieldError error={errors.password} />
                    </div>
                    <div>
                      <label className={labelCls}>Confirm Password</label>
                      <input name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} disabled={isView} className={inputCls(errors, "confirmPassword")} placeholder="Re-enter password" autoComplete="new-password" />
                      <FieldError error={errors.confirmPassword} />
                    </div>
                    <div className="md:col-span-2 flex items-center gap-2">
                      <input type="checkbox" id="twoFactor" name="twoFactorEnabled" checked={formData.twoFactorEnabled} onChange={handleChange} disabled={isView} className="rounded border-[#E5E7EB]" />
                      <label htmlFor="twoFactor" className="text-sm font-medium text-[#374151]">Two-Factor Authentication</label>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Step 4: Role + Account */}
            {step === 3 && (
              <>
                <div className={cardCls}>
                  <div className={sectionTitleCls}>
                    <FiShield className="text-[#2563EB]" size={14} /> Role & Permissions
                  </div>
                  <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>User Role <span className="text-red-500">*</span></label>
                      <select name="role" value={formData.role} onChange={handleChange} className={inputCls(errors, "role")} disabled={isView || isBranchManager}>
                        {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                      </select>
                      <FieldError error={errors.role} />
                    </div>
                    <div>
                      <label className={labelCls}>Department</label>
                      <input name="department" value={formData.department} onChange={handleChange} disabled={isView} className={inputCls(errors, "department")} placeholder="e.g. Sales" />
                      <FieldError error={errors.department} />
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelCls}>Reporting Manager</label>
                      <select name="reportingManagerId" value={formData.reportingManagerId} onChange={handleChange} disabled={isView} className={inputCls(errors, "reportingManagerId")}>
                        <option value="">Select manager...</option>
                        {users.filter((u) => u._id !== id).map((u) => <option key={u._id} value={u._id}>{u.name} {u.email ? `(${u.email})` : ""}</option>)}
                      </select>
                      <FieldError error={errors.reportingManagerId} />
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelCls}>Permission Level</label>
                      <input name="permissionLevel" value={formData.permissionLevel} onChange={handleChange} disabled={isView} className={inputCls(errors, "permissionLevel")} placeholder="e.g. Standard" />
                      <FieldError error={errors.permissionLevel} />
                    </div>
                    <div>
                      <label className={labelCls}>Status</label>
                      <select name="status" value={formData.status} onChange={handleChange} disabled={isView} className={inputCls(errors, "status")}>
                        {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                      <FieldError error={errors.status} />
                    </div>
                    <div>
                      <label className={labelCls}>Language</label>
                      <select name="language" value={formData.language} onChange={handleChange} disabled={isView} className={inputCls(errors, "language")}>
                        {LANGUAGES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                      </select>
                      <FieldError error={errors.language} />
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelCls}>Timezone</label>
                      <select name="timezone" value={formData.timezone} onChange={handleChange} disabled={isView} className={inputCls(errors, "timezone")}>
                        {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
                      </select>
                      <FieldError error={errors.timezone} />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
          </div>
        </div>

      </form>

      {/* Sticky actions - Moved OUTSIDE form to prevent accidental submission */}
      <div className="shrink-0 sticky bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E5E7EB] shadow-lg py-4 px-5 md:px-6">
        <div className="w-full max-w-[1100px] mx-auto flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={step === 0 ? () => navigate(-1) : goBack}
            className="px-4 py-2 rounded-lg border border-[#E5E7EB] text-[#6B7280] font-semibold hover:bg-[#F8FAFC] text-sm disabled:opacity-50"
          >
            Back
          </button>
          {!isView && (
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={loading}
              className="px-4 py-2 rounded-lg border border-[#E5E7EB] text-[#111827] font-semibold hover:bg-[#F8FAFC] text-sm disabled:opacity-50"
            >
              Save Draft
            </button>
          )}
          {!isView && step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={goNext}
              disabled={loading || isStepChanging}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[#2563EB] text-white font-semibold hover:bg-[#1D4ED8] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm text-sm transition-all"
            >
              Next
            </button>
          ) : (
            <button
              type="submit"
              form="user-form"
              disabled={loading || isView || isStepChanging}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[#2563EB] text-white font-semibold hover:bg-[#1D4ED8] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm text-sm transition-all"
            >
              {loading || isStepChanging ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FiSave size={16} />}
              {isEdit ? "Update User" : "Create User"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
