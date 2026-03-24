import React from "react";
import { FiUser, FiMail, FiPhone, FiShield, FiGitBranch, FiClock } from "react-icons/fi";
import { getCurrentUser } from "../context/AuthContext";

const Field = ({ label, value }) => (
  <div>
    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
    <p className="text-sm font-medium text-gray-900 mt-0.5 break-words">{value ?? "—"}</p>
  </div>
);

export default function Profile() {
  const user = getCurrentUser();

  if (!user) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
        <p className="text-sm text-gray-600">No user session found.</p>
      </div>
    );
  }

  const initials =
    (user.name || "U")
      .split(" ")
      .map((s) => s[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  return (
    <div className="space-y-6 pb-8">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-teal-700 text-white flex items-center justify-center font-bold shadow-sm">
            {initials}
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-gray-900 truncate">{user.name || "User profile"}</h1>
            <p className="text-sm text-gray-500 capitalize">{(user.role || "member").replace("_", " ")}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
            <FiUser className="text-teal-700" />
            <h2 className="text-sm font-semibold text-gray-900">Personal</h2>
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="First name" value={user.firstName} />
            <Field label="Last name" value={user.lastName} />
            <Field label="Display name" value={user.displayName} />
            <Field label="Gender" value={user.gender} />
            <Field label="Date of birth" value={user.dob} />
            <Field label="Employee ID" value={user.employeeId} />
          </div>
        </div>

        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
              <FiMail className="text-teal-700" />
              <h2 className="text-sm font-semibold text-gray-900">Contact</h2>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Work email" value={user.email} />
              <Field label="Personal email" value={user.personalEmail} />
              <Field label="Phone" value={user.phone} />
              <Field label="Alternate phone" value={user.alternatePhone} />
              <Field label="WhatsApp" value={user.whatsappNumber} />
              <Field label="Address" value={user.address} />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
              <FiShield className="text-teal-700" />
              <h2 className="text-sm font-semibold text-gray-900">Access</h2>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Role" value={(user.role || "").replace("_", " ")} />
              <Field label="Department" value={user.department} />
              <Field label="Status" value={user.status} />
              <Field label="Permission level" value={user.permissionLevel} />
              <Field label="Team" value={user.team} />
              <Field label="Territory" value={user.territory} />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
              <FiGitBranch className="text-teal-700" />
              <h2 className="text-sm font-semibold text-gray-900">Branch & Company</h2>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Company ID" value={user.companyId} />
              <Field label="Primary branch ID" value={user.primaryBranchId || user.branchId} />
              <Field label="Additional branches" value={Array.isArray(user.additionalBranchAccess) ? user.additionalBranchAccess.join(", ") : user.additionalBranchAccess} />
              <Field label="Reporting manager" value={user.reportingManagerId} />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
              <FiClock className="text-teal-700" />
              <h2 className="text-sm font-semibold text-gray-900">Meta</h2>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Created at" value={user.createdAt} />
              <Field label="Updated at" value={user.updatedAt} />
              <Field label="Last login" value={user.lastLoginAt} />
              <Field label="Timezone" value={user.timezone} />
              <Field label="Language" value={user.language} />
              <Field label="2FA enabled" value={user.twoFactorEnabled ? "Yes" : "No"} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

