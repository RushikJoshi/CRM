import React from "react";

/**
 * Dashboard metric card – clean, minimal, design system.
 * Small icon, large metric number, small label, optional trend.
 */
const MetricCard = ({
  title,
  value,
  icon,
  trend,
  onClick,
  className = "",
}) => {
  const Wrapper = onClick ? "button" : "div";
  return (
    <Wrapper
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`
        w-full text-left bg-[#FFFFFF] rounded-xl border border-[#E5E7EB]
        p-6 transition-all duration-200
        ${onClick ? "hover:border-[#2563EB]/30 hover:shadow-crm-card cursor-pointer" : ""}
        ${className}
      `}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-[#6B7280] [&>svg]:w-5 [&>svg]:h-5">{icon}</span>
        {trend != null && (
          <span
            className={`text-xs font-medium ${
              trend >= 0 ? "text-[#22C55E]" : "text-[#6B7280]"
            }`}
          >
            {trend >= 0 ? "+" : ""}
            {trend}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-[#111827] tracking-tight">{value}</p>
      <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wider mt-1">
        {title}
      </p>
    </Wrapper>
  );
};

export default MetricCard;
