const MasterData = require("../models/MasterData");

const DEFAULT_MASTERS = {
    lead_status: [
        { name: "New", order: 1 },
        { name: "Contacted", order: 2 },
        { name: "Qualified", order: 3 },
        { name: "Proposal Sent", order: 4 },
        { name: "Negotiation", order: 5 },
        { name: "Won", order: 6 },
        { name: "Lost", order: 7 }
    ],
    lead_source: [
        { name: "Website", order: 1 },
        { name: "Facebook", order: 2 },
        { name: "Google Ads", order: 3 },
        { name: "Instagram", order: 4 },
        { name: "Referral", order: 5 },
        { name: "Direct Call", order: 6 },
        { name: "Walk-In", order: 7 },
        { name: "Email Campaign", order: 8 }
    ],
    industry: [
        { name: "Information Technology", order: 1 },
        { name: "Manufacturing", order: 2 },
        { name: "Education", order: 3 },
        { name: "Healthcare", order: 4 },
        { name: "Real Estate", order: 5 },
        { name: "Retail", order: 6 },
        { name: "Finance", order: 7 },
        { name: "Construction", order: 8 }
    ],
    department: [
        { name: "Sales", order: 1 },
        { name: "Marketing", order: 2 },
        { name: "Customer Support", order: 3 },
        { name: "Finance", order: 4 },
        { name: "Management", order: 5 }
    ],
    buying_role: [
        { name: "Decision Maker", order: 1 },
        { name: "Influencer", order: 2 },
        { name: "Technical Evaluator", order: 3 },
        { name: "End User", order: 4 }
    ],
    deal_stage: [
        { name: "New Deal", order: 1 },
        { name: "Qualified", order: 2 },
        { name: "Proposal Sent", order: 3 },
        { name: "Negotiation", order: 4 },
        { name: "Closed Won", order: 5 },
        { name: "Closed Lost", order: 6 }
    ],
    call_outcome: [
        { name: "Connected", order: 1 },
        { name: "No Answer", order: 2 },
        { name: "Call Back Later", order: 3 },
        { name: "Interested", order: 4 },
        { name: "Not Interested", order: 5 }
    ],
    meeting_outcome: [
        { name: "Meeting Scheduled", order: 1 },
        { name: "Meeting Completed", order: 2 },
        { name: "Follow-Up Required", order: 3 },
        { name: "Cancelled", order: 4 }
    ],
    task_priority: [
        { name: "Low", order: 1 },
        { name: "Medium", order: 2 },
        { name: "High", order: 3 },
        { name: "Urgent", order: 4 }
    ],
    task_status: [
        { name: "Pending", order: 1 },
        { name: "In Progress", order: 2 },
        { name: "Completed", order: 3 },
        { name: "Cancelled", order: 4 }
    ],
    customer_type: [
        { name: "Prospect", order: 1 },
        { name: "Client", order: 2 },
        { name: "Partner", order: 3 },
        { name: "Vendor", order: 4 }
    ]
};

exports.seedMasterDataForCompany = async (companyId, userId) => {
    try {
        const existing = await MasterData.findOne({ companyId });
        if (existing) return;

        console.log(`Seeding master data for company: ${companyId}`);

        const masterItems = [];
        for (const [type, items] of Object.entries(DEFAULT_MASTERS)) {
            items.forEach((item) => {
                masterItems.push({
                    type,
                    name: item.name,
                    order: item.order,
                    companyId,
                    createdBy: userId,
                    status: "active"
                });
            });
        }

        await MasterData.insertMany(masterItems);
        return true;
    } catch (error) {
        console.error("Master Seeding Error:", error);
        return false;
    }
};

exports.DEFAULT_MASTERS = DEFAULT_MASTERS;
