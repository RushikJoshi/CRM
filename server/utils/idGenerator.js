const Counter = require("../models/Counter");
const Company = require("../models/Company");

const getNextCustomId = async ({ companyId, module, companyName }) => {
  let companyCode;
  
  if (module.toLowerCase() === "company") {
    // For general platform-level companies, we use a single global sequence
    companyCode = (companyName || "CRM").substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '');
    if (companyCode.length < 3) companyCode = (companyName || "CRMXXXX").substring(0, 4).toUpperCase().replace(/[^A-Z]/g, '');
  } else {
    const company = await Company.findById(companyId);
    if (!company) throw new Error("Company not found");

    companyCode = company.code;
    if (!companyCode) {
      companyCode = company.name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '');
      if (companyCode.length < 3) companyCode = (company.name + "XXX").substring(0, 4).toUpperCase().replace(/[^A-Z]/g, '');
      await Company.findByIdAndUpdate(companyId, { code: companyCode });
    }
  }


  const year = new Date().getFullYear();
  // Module tags as per requirement or short tags
  const moduleTagMap = {
    "lead": "LEAD",
    "company": "COMP",
    "deal": "DEAL"
  };
  const moduleTag = moduleTagMap[module.toLowerCase()] || module.toUpperCase();

  const counter = await Counter.findOneAndUpdate(
    { companyId: module.toLowerCase() === "company" ? null : companyId, module: module.toLowerCase(), year },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );


  const customId = `${companyCode}-${moduleTag}-${year}-${String(counter.seq).padStart(4, "0")}`;
  return customId;
};

module.exports = { getNextCustomId };
