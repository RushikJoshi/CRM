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
import CitySelect from "../../components/CitySelect";
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
  { value: "draft", label: "Draft" },
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
const isValidPhone = (value) => /^\d{10,15}$/.test(String(value || "").replace(/\D/g, ""));
const requiredPostalCodeRule = (value) =>
  !String(value || "").trim()
    ? "Postal code is required"
    : !/^\d{6}$/.test(String(value).trim())
    ? "Enter a valid 6-digit postal code"
    : null;
const requiredNumberRule = (label) => (value) => {
  const nextValue = String(value ?? "").trim();
  if (!nextValue) return `${label} is required`;
  const n = Number(nextValue);
  if (!Number.isFinite(n)) return `${label} must be a valid number`;
  if (n < 0) return `${label} cannot be negative`;
  return null;
};

const getDraftResumeStep = (data, isSuperAdmin) => {
  if (!String(data?.name || "").trim()) return 0;
  if (isSuperAdmin && !String(data?.companyId || "").trim()) return 0;
  if (!String(data?.branchManagerId || "").trim()) return 1;
  if (!isValidPhone(data?.phone)) return 2;
  if (!String(data?.cityId || "").trim()) return 3;
  if (String(data?.postalCode || "").trim() && !/^\d{6}$/.test(String(data?.postalCode).trim())) return 3;
  return 4;
};

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
  const [isStepChanging, setIsStepChanging] = useState(false);
  const [postalLookupLoading, setPostalLookupLoading] = useState(false);
  const [pendingValidationStep, setPendingValidationStep] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    branchCode: "",
    branchType: "sales_branch",
    status: "active",
    email: "",
    phone: "",
    alternatePhone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    cityId: "",
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
  const managerIds = React.useMemo(
    () =>
      new Set(
        users
          .filter((user) => ["branch_manager", "company_admin"].includes(user.role))
          .map((user) => String(user._id))
      ),
    [users]
  );

  const fullSchema = React.useMemo(() => ({
    name: [rules.required("Branch name")],
    branchCode: [rules.required("Branch code")],
    branchType: [rules.required("Branch type")],
    status: [rules.required("Status")],
    branchManagerId: [
      rules.required("Branch manager"),
      (value) =>
        value && managerIds.size > 0 && !managerIds.has(String(value))
          ? "Please select a valid branch manager"
          : null,
    ],
    email: [rules.required("Branch email"), rules.email()],
    phone: [rules.required("Branch phone"), rules.phone()],
    alternatePhone: [rules.required("Alternate phone"), rules.phone()],
    managerEmail: [rules.required("Manager email"), rules.email()],
    managerPhone: [rules.required("Manager phone"), rules.phone()],
    assignedUserIds: [
      (value) => (Array.isArray(value) && value.length > 0 ? null : "Please assign at least one user"),
    ],
    ...(isSuperAdmin && { companyId: [rules.required("Company")] }),
    addressLine1: [rules.required("Address line 1")],
    addressLine2: [rules.required("Address line 2")],
    cityId: [rules.required("City")],
    state: [rules.required("State")],
    country: [rules.required("Country")],
    postalCode: [requiredPostalCodeRule],
    latitude: [rules.required("Latitude")],
    longitude: [rules.required("Longitude")],
    openingDate: [rules.required("Opening date")],
    workingHours: [rules.required("Working hours")],
    timezone: [rules.required("Timezone")],
    branchCapacity: [requiredNumberRule("Branch capacity")],
  }), [isSuperAdmin, managerIds]);

  const stepSchema = React.useMemo(() => {
    // Validate only current step fields.
    if (step === 0) {
      return {
        name: fullSchema.name,
        branchCode: fullSchema.branchCode,
        branchType: fullSchema.branchType,
        status: fullSchema.status,
        ...(isSuperAdmin ? { companyId: fullSchema.companyId } : {}),
      };
    }
    if (step === 1) return {
      branchManagerId: fullSchema.branchManagerId,
      managerEmail: fullSchema.managerEmail,
      managerPhone: fullSchema.managerPhone,
      assignedUserIds: fullSchema.assignedUserIds,
    };
    if (step === 2) return {
      email: fullSchema.email,
      phone: fullSchema.phone,
      alternatePhone: fullSchema.alternatePhone,
    };
    if (step === 3) {
      return {
        addressLine1: fullSchema.addressLine1,
        addressLine2: fullSchema.addressLine2,
        cityId: fullSchema.cityId,
        state: fullSchema.state,
        country: fullSchema.country,
        postalCode: fullSchema.postalCode,
        latitude: fullSchema.latitude,
        longitude: fullSchema.longitude,
      };
    }
    if (step === 4) {
      return {
        openingDate: fullSchema.openingDate,
        workingHours: fullSchema.workingHours,
        timezone: fullSchema.timezone,
        branchCapacity: fullSchema.branchCapacity,
      };
    }
    return {};
  }, [step, isSuperAdmin, fullSchema]);

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
    let active = true;
    API.get("/super-admin/companies?limit=500")
      .then((res) => {
        if (!active) return;
        const data = res.data?.data || res.data?.companies || res.data;
        setCompanies(Array.isArray(data) ? data : []);
      })
      .catch(() => {});
    return () => { active = false; };
  }, [isSuperAdmin]);

  // Fetch users for manager/assigned (when company known)
  const companyIdForUsers = isSuperAdmin ? formData.companyId : currentUser?.companyId;
  useEffect(() => {
    if (!companyIdForUsers) {
      setUsers([]);
      return;
    }
    let active = true;
    const url = isSuperAdmin ? `${usersBase}?companyId=${companyIdForUsers}` : usersBase;
    API.get(url)
      .then((res) => {
        if (!active) return;
        const data = res.data?.data || res.data || [];
        setUsers(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (active) setUsers([]);
      });
    return () => { active = false; };
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
        const nextFormData = {
          name: b.name || "",
          branchCode: b.branchCode || "",
          branchType: b.branchType || "sales_branch",
          status: b.status || "active",
          email: b.email || "",
          phone: b.phone || "",
          alternatePhone: b.alternatePhone || "",
          addressLine1: b.addressLine1 || "",
          addressLine2: b.addressLine2 || "",
          city: b.city || "",
          cityId: b.cityId?._id || b.cityId || "",
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
          companyId: b.companyId?._id || b.companyId || currentUser?.companyId || "",
        };

        setFormData(nextFormData);
        if (String(b.status || "").toLowerCase() === "draft") {
          setStep(getDraftResumeStep(nextFormData, isSuperAdmin));
        }
      })
      .catch(() => toast.error("Failed to load branch"))
      .finally(() => setFetching(false));
  }, [id, isEdit, apiBase, isSuperAdmin, currentUser?.companyId, toast]);

  useEffect(() => {
    clearAllErrors?.();
  }, [step, clearAllErrors]);

  useEffect(() => {
    if (pendingValidationStep == null || pendingValidationStep !== step) return;
    validate(formData);
    setPendingValidationStep(null);
  }, [pendingValidationStep, step, validate, formData]);

  const managerOptions = React.useMemo(
    () => users.filter((user) => ["branch_manager", "company_admin"].includes(user.role)),
    [users]
  );

  const assignedUserOptions = React.useMemo(
    () => users.filter((user) => user._id !== formData.branchManagerId),
    [users, formData.branchManagerId]
  );

  const validateAgainstSchema = useCallback((schema, data) => {
    for (const field of Object.keys(schema)) {
      const fieldRules = schema[field] || [];
      for (const rule of fieldRules) {
        if (rule(data[field])) {
          return false;
        }
      }
    }
    return true;
  }, []);

  const getStepSchema = useCallback((stepIndex) => {
    if (stepIndex === 0) {
      return {
        name: fullSchema.name,
        branchCode: fullSchema.branchCode,
        branchType: fullSchema.branchType,
        status: fullSchema.status,
        ...(isSuperAdmin ? { companyId: fullSchema.companyId } : {}),
      };
    }
    if (stepIndex === 1) {
      return {
        branchManagerId: fullSchema.branchManagerId,
        managerEmail: fullSchema.managerEmail,
        managerPhone: fullSchema.managerPhone,
        assignedUserIds: fullSchema.assignedUserIds,
      };
    }
    if (stepIndex === 2) {
      return {
        email: fullSchema.email,
        phone: fullSchema.phone,
        alternatePhone: fullSchema.alternatePhone,
      };
    }
    if (stepIndex === 3) {
      return {
        addressLine1: fullSchema.addressLine1,
        addressLine2: fullSchema.addressLine2,
        cityId: fullSchema.cityId,
        state: fullSchema.state,
        country: fullSchema.country,
        postalCode: fullSchema.postalCode,
        latitude: fullSchema.latitude,
        longitude: fullSchema.longitude,
      };
    }
    if (stepIndex === 4) {
      return {
        openingDate: fullSchema.openingDate,
        workingHours: fullSchema.workingHours,
        timezone: fullSchema.timezone,
        branchCapacity: fullSchema.branchCapacity,
      };
    }
    return {};
  }, [fullSchema, isSuperAdmin]);

  const firstInvalidStep = useCallback(() => {
    for (let index = 0; index < 5; index += 1) {
      if (!validateAgainstSchema(getStepSchema(index), formData)) {
        return index;
      }
    }
    return -1;
  }, [formData, getStepSchema, validateAgainstSchema]);

  const handleManagerChange = useCallback((e) => {
    const managerId = e.target.value;
    const selectedManager = users.find((user) => user._id === managerId);

    setFormData((prev) => ({
      ...prev,
      branchManagerId: managerId,
      managerEmail: selectedManager ? (selectedManager.workEmail || selectedManager.email || "") : "",
      managerPhone: selectedManager?.phone || "",
      assignedUserIds: prev.assignedUserIds.filter((userId) => userId !== managerId),
    }));

    clearError("branchManagerId");
    clearError("managerEmail");
    clearError("managerPhone");
  }, [users, clearError]);

  useEffect(() => {
    if (!formData.branchManagerId) return;

    const selectedManager = users.find((user) => user._id === formData.branchManagerId);
    if (!selectedManager) return;

    const nextEmail = selectedManager.workEmail || selectedManager.email || "";
    const nextPhone = selectedManager.phone || "";

    setFormData((prev) => {
      const nextAssignedUsers = prev.assignedUserIds.filter((userId) => userId !== formData.branchManagerId);
      if (
        prev.managerEmail === nextEmail &&
        prev.managerPhone === nextPhone &&
        nextAssignedUsers.length === prev.assignedUserIds.length
      ) {
        return prev;
      }

      return {
        ...prev,
        managerEmail: nextEmail,
        managerPhone: nextPhone,
        assignedUserIds: nextAssignedUsers,
      };
    });
  }, [users, formData.branchManagerId]);

  const buildPayload = useCallback((statusOverride) => ({
    ...formData,
    status: statusOverride || formData.status,
    website: "",
    name: String(formData.name || "").trim(),
    branchCode: formData.branchCode?.trim() || undefined,
    latitude: formData.latitude ? Number(formData.latitude) : undefined,
    longitude: formData.longitude ? Number(formData.longitude) : undefined,
    branchCapacity: formData.branchCapacity ? Number(formData.branchCapacity) : undefined,
    openingDate: formData.openingDate || undefined,
    assignedUserIds: formData.assignedUserIds.filter(Boolean),
    documentUrls: formData.documentUrls.filter(Boolean),
  }), [formData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step < STEPS.length - 1) {
      goNext();
      return;
    }

    const invalidStep = firstInvalidStep();
    if (invalidStep !== -1) {
      setStep(invalidStep);
      setPendingValidationStep(invalidStep);
      toast.error("Please fix the errors before saving.");
      return;
    }
    setLoading(true);
    try {
      const payload = buildPayload(formData.status === "draft" ? "active" : undefined);
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
        ...buildPayload("draft"),
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
    setIsStepChanging(true);
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
    setTimeout(() => setIsStepChanging(false), 500);
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

  // Indian Postal API: pincode -> city, state, country
  const fetchAddressByPincode = useCallback(async (pincode) => {
    const pin = String(pincode).trim();
    if (pin.length !== 6 || !/^\d{6}$/.test(pin)) return;
    setPostalLookupLoading(true);
    try {
      const res = await API.get(`/branches/postal-code/${pin}`);
      const address = res.data?.data;
      if (address) {
        setFormData((prev) => ({
          ...prev,
          postalCode: address.postalCode || pin,
          city: address.city || prev.city,
          cityId: address.cityId || prev.cityId,
          state: address.state || prev.state,
          country: address.country || prev.country || "India",
        }));
        clearError("postalCode");
        if (address.cityId) {
          clearError("cityId");
        } else {
          toast.error("Pincode found, but please confirm the city from the list.");
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to auto-fill address from pincode.");
    } finally {
      setPostalLookupLoading(false);
    }
  }, [clearError, toast]);

  const handlePostalCodeBlur = () => {
    if (formData.postalCode?.trim().length === 6) {
      fetchAddressByPincode(formData.postalCode.trim());
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

      <form id="branch-form" onSubmit={handleSubmit} onKeyDown={handleKeyDown} noValidate className="flex-1 min-h-0 overflow-auto pb-4">
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
              <FieldError error={errors.branchCode} />
            </div>
            <div>
              <label className={labelCls}>Type</label>
              <select name="branchType" value={formData.branchType} onChange={handleChange} className={inputCls(errors, "branchType")}>
                {BRANCH_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <FieldError error={errors.branchType} />
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <select name="status" value={formData.status} onChange={handleChange} className={inputCls(errors, "status")}>
                {BRANCH_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              <FieldError error={errors.status} />
            </div>
          </div>
            </div>
            )}

            {step === 1 && (
            <div className={cardCls}>
              <div className={sectionTitleCls}>Branch Management</div>
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Branch Manager <span className="text-red-500">*</span></label>
              <select name="branchManagerId" value={formData.branchManagerId} onChange={handleManagerChange} className={inputCls(errors, "branchManagerId")}>
                <option value="">Select manager...</option>
                {managerOptions.map((u) => <option key={u._id} value={u._id}>{u.name} {u.email ? `(${u.email})` : ""}</option>)}
              </select>
              <FieldError error={errors.branchManagerId} />
            </div>
            <div>
              <label className={labelCls}>Manager Email</label>
              <input name="managerEmail" type="email" value={formData.managerEmail} onChange={handleChange} className={inputCls(errors, "managerEmail")} readOnly={Boolean(formData.branchManagerId)} />
              <FieldError error={errors.managerEmail} />
            </div>
            <div>
              <label className={labelCls}>Manager Phone</label>
              <input name="managerPhone" type="tel" value={formData.managerPhone} onChange={handleChange} className={inputCls(errors, "managerPhone")} readOnly={Boolean(formData.branchManagerId)} />
              <FieldError error={errors.managerPhone} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Assigned Users (Ctrl+click multi)</label>
              <select
                multiple
                value={formData.assignedUserIds}
                onChange={(e) => setField("assignedUserIds", Array.from(e.target.selectedOptions, (o) => o.value))}
                className={inputCls(errors, "assignedUserIds") + " min-h-[88px]"}
              >
                {assignedUserOptions.map((u) => <option key={u._id} value={u._id}>{u.name} ({u.email})</option>)}
              </select>
              <FieldError error={errors.assignedUserIds} />
              <p className="mt-1 text-xs text-[#6B7280]">Manager contact details auto-fill from the selected manager.</p>
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
                    <FieldError error={errors.phone} />
                  </div>
                  <div>
                    <label className={labelCls}>Alternate Phone</label>
                    <input name="alternatePhone" type="tel" value={formData.alternatePhone} onChange={handleChange} className={inputCls(errors, "alternatePhone")} />
                    <FieldError error={errors.alternatePhone} />
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
                    <FieldError error={errors.addressLine1} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelCls}>Address Line 2</label>
                    <input name="addressLine2" type="text" value={formData.addressLine2} onChange={handleChange} className={inputCls(errors, "addressLine2")} />
                    <FieldError error={errors.addressLine2} />
                  </div>
                  <div>
                    <label className={labelCls}>City <span className="text-red-500">*</span></label>
                    <CitySelect 
                      value={formData.cityId} 
                      displayText={formData.city}
                      onChange={(id, name, city) => {
                        setFormData(prev => ({
                          ...prev,
                          cityId: id,
                          city: name,
                          state: city?.state || prev.state,
                          country: city?.country || prev.country,
                        }));
                        clearError("cityId");
                      }} 
                      error={errors.cityId}
                    />
                    <FieldError error={errors.cityId} />
                  </div>
                  <div>
                    <label className={labelCls}>State</label>
                    <input name="state" type="text" value={formData.state} onChange={handleChange} className={inputCls(errors, "state")} />
                    <FieldError error={errors.state} />
                  </div>
                  <div>
                    <label className={labelCls}>Country</label>
                    <input name="country" type="text" value={formData.country} onChange={handleChange} className={inputCls(errors, "country")} />
                    <FieldError error={errors.country} />
                  </div>
                  <div>
                    <label className={labelCls}>Postal Code (6-digit; auto-fills city/state/country on blur)</label>
                    <input
                      name="postalCode"
                      type="text"
                      value={formData.postalCode}
                      onChange={(e) => setField("postalCode", e.target.value.replace(/\D/g, "").slice(0, 6))}
                      onBlur={handlePostalCodeBlur}
                      className={inputCls(errors, "postalCode")}
                      placeholder="e.g. 400001"
                      maxLength={6}
                      disabled={postalLookupLoading}
                    />
                    <FieldError error={errors.postalCode} />
                    <p className="mt-1 text-xs text-[#6B7280]">
                      {postalLookupLoading ? "Checking postal code..." : "Enter 6 digits to auto-fill city, state, and country."}
                    </p>
                  </div>
                  <div>
                    <label className={labelCls}>Latitude</label>
                    <input name="latitude" type="text" placeholder="19.0760" value={formData.latitude} onChange={handleChange} className={inputCls(errors, "latitude")} />
                    <FieldError error={errors.latitude} />
                  </div>
                  <div>
                    <label className={labelCls}>Longitude</label>
                    <input name="longitude" type="text" placeholder="72.8777" value={formData.longitude} onChange={handleChange} className={inputCls(errors, "longitude")} />
                    <FieldError error={errors.longitude} />
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
                  <FieldError error={errors.openingDate} />
                </div>
                <div>
                  <label className={labelCls}>Working Hours</label>
                  <input name="workingHours" type="text" placeholder="9 AM - 6 PM" value={formData.workingHours} onChange={handleChange} className={inputCls(errors, "workingHours")} />
                  <FieldError error={errors.workingHours} />
                </div>
                <div>
                  <label className={labelCls}>Timezone</label>
                  <select name="timezone" value={formData.timezone} onChange={handleChange} className={inputCls(errors, "timezone")}>
                    {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
                  </select>
                  <FieldError error={errors.timezone} />
                </div>
                <div>
                  <label className={labelCls}>Branch Capacity</label>
                  <input name="branchCapacity" type="number" min={0} placeholder="Seats" value={formData.branchCapacity} onChange={handleChange} className={inputCls(errors, "branchCapacity")} />
                  <FieldError error={errors.branchCapacity} />
                </div>
              </div>
              </div>
            )}
          </div>
        </div>

      </form>

      {/* Sticky actions - Moved OUTSIDE form to prevent accidental submission */}
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
                disabled={isStepChanging || loading}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[#0D9488] text-white font-semibold hover:bg-[#0F766E] disabled:opacity-50 shadow-sm text-sm transition-all"
              >
                Next →
              </button>
            ) : (
              <button
                type="submit"
                form="branch-form"
                disabled={isStepChanging || loading}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[#0D9488] text-white font-semibold hover:bg-[#0F766E] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm text-sm transition-all"
              >
                {loading || isStepChanging ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FiSave size={16} />}
                Submit
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

