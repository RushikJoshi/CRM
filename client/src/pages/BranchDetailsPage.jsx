import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import API from "../services/api";
import { getCurrentUser } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const formatValue = (value) => {
  if (value === null || value === undefined) return "-";
  if (typeof value === "string" && !value.trim()) return "-";
  return String(value);
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const DetailTable = ({ title, rows }) => (
  <div className="crm-card overflow-hidden">
    <div className="crm-card-head">{title}</div>
    <table className="w-full text-sm">
      <tbody>
        {rows.map((row) => (
          <tr key={row.label} className="border-b border-slate-100 last:border-b-0">
            <th className="w-44 text-left px-4 py-2 text-slate-500 font-medium">{row.label}</th>
            <td className="px-4 py-2 text-slate-800">{row.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default function BranchDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const currentUser = getCurrentUser();
  const isSuperAdmin = currentUser?.role === "super_admin";
  const isSales = currentUser?.role === "sales";
  const rolePath = isSuperAdmin ? "/superadmin" : isSales ? "/sales" : currentUser?.role === "branch_manager" ? "/branch" : "/company";
  const apiBase = isSuperAdmin ? "/super-admin/branches" : "/branches";

  const [loading, setLoading] = useState(true);
  const [branch, setBranch] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await API.get(`${apiBase}/${id}`);
        if (!active) return;
        setBranch(res.data?.data || res.data || null);
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to load branch details.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [id, apiBase, toast]);

  if (loading) {
    return (
      <div className="crm-page">
        <div className="crm-card p-20 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!branch) {
    return (
      <div className="crm-page">
        <div className="crm-card p-6">Branch not found.</div>
      </div>
    );
  }

  return (
    <div className="crm-page space-y-4 animate-fade-in">
      <div className="crm-card p-4 flex items-center justify-between">
        <div>
          <button type="button" onClick={() => navigate(-1)} className="text-sm font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1">
            <FiArrowLeft size={15} /> Back
          </button>
          <h1 className="text-xl font-semibold mt-2">Branch Details</h1>
          <p className="text-sm text-slate-500">{formatValue(branch.name)} ({formatValue(branch.branchCode)})</p>
        </div>
        <button type="button" onClick={() => navigate(`${rolePath}/branches/${branch._id}/edit`)} className="crm-btn-primary">
          Edit Branch
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DetailTable
          title="Basic Information"
          rows={[
            { label: "Name", value: formatValue(branch.name) },
            { label: "Branch Code", value: formatValue(branch.branchCode) },
            { label: "Type", value: formatValue(branch.branchType) },
            { label: "Status", value: formatValue(branch.status).toUpperCase() },
            { label: "Company", value: formatValue(branch.companyId?.name || branch.companyId) },
            { label: "Description", value: formatValue(branch.description) },
          ]}
        />
        <DetailTable
          title="Management"
          rows={[
            { label: "Manager", value: formatValue(branch.branchManagerId?.name || "Unassigned") },
            { label: "Manager Email", value: formatValue(branch.managerEmail || branch.branchManagerId?.email) },
            { label: "Manager Phone", value: formatValue(branch.managerPhone) },
            { label: "Assigned Users", value: Array.isArray(branch.assignedUserIds) && branch.assignedUserIds.length ? branch.assignedUserIds.map((u) => u?.name || u?.email || u?._id || String(u)).join(", ") : "-" },
          ]}
        />
        <DetailTable
          title="Contact"
          rows={[
            { label: "Branch Email", value: formatValue(branch.email) },
            { label: "Branch Phone", value: formatValue(branch.phone) },
            { label: "Alternate Phone", value: formatValue(branch.alternatePhone) },
            { label: "Website", value: formatValue(branch.website) },
          ]}
        />
        <DetailTable
          title="Address"
          rows={[
            { label: "Address Line 1", value: formatValue(branch.addressLine1) },
            { label: "Address Line 2", value: formatValue(branch.addressLine2) },
            { label: "City", value: formatValue(branch.city || branch.cityId?.name) },
            { label: "State", value: formatValue(branch.state || branch.cityId?.state) },
            { label: "Country", value: formatValue(branch.country) },
            { label: "Postal Code", value: formatValue(branch.postalCode) },
            { label: "Latitude", value: formatValue(branch.latitude) },
            { label: "Longitude", value: formatValue(branch.longitude) },
          ]}
        />
        <DetailTable
          title="Operational"
          rows={[
            { label: "Opening Date", value: formatDateTime(branch.openingDate) },
            { label: "Working Hours", value: formatValue(branch.workingHours) },
            { label: "Timezone", value: formatValue(branch.timezone) },
            { label: "Branch Capacity", value: formatValue(branch.branchCapacity) },
          ]}
        />
        <DetailTable
          title="Audit & Meta"
          rows={[
            { label: "Record ID", value: formatValue(branch._id) },
            { label: "Created By", value: formatValue(branch.createdBy?.name || branch.createdBy) },
            { label: "Updated By", value: formatValue(branch.updatedBy?.name || branch.updatedBy) },
            { label: "Created At", value: formatDateTime(branch.createdAt) },
            { label: "Updated At", value: formatDateTime(branch.updatedAt) },
            { label: "Documents", value: Array.isArray(branch.documentUrls) && branch.documentUrls.length ? branch.documentUrls.join(", ") : "-" },
          ]}
        />
      </div>
    </div>
  );
}

