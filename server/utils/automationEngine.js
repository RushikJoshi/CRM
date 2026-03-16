const AutomationRule = require("../models/AutomationRule");
const { createNotification } = require("./notificationService");
const User = require("../models/User");
const Todo = require("../models/Todo");

/**
 * Enterprise Automation Engine
 * Processes organizational triggers and executes jurisdictional actions.
 */
const runAutomation = async (triggerName, companyId, context = {}) => {
    try {
        const rules = await AutomationRule.find({
            companyId,
            trigger: triggerName,
            status: "active"
        });

        for (const rule of rules) {
            // Check conditions (Simple exact match for now)
            let match = true;
            for (const key in rule.conditions) {
                if (context[key] !== rule.conditions[key]) {
                    match = false;
                    break;
                }
            }

            if (match) {
                for (const action of rule.actions) {
                    await executeAction(action, context, companyId);
                }
            }
        }
    } catch (error) {
        console.error("Automation Engine Error:", error);
    }
};

const executeAction = async (action, context, companyId) => {
    const { type, params } = action;

    switch (type) {
        case "assign_to_branch":
            if (context.record && context.record.constructor.modelName === 'Lead') {
                context.record.branchId = params.branchId;
                await context.record.save();
            }
            break;

        case "assign_to_user":
            if (context.record) {
                context.record.assignedTo = params.userId;
                await context.record.save();
            }
            break;

        case "create_notification":
            const recipients = params.userId ? [params.userId] : await getAdminUsers(companyId);
            for (const uid of recipients) {
                await createNotification({
                    userId: uid,
                    companyId,
                    title: params.title || "Automation Triggered",
                    message: params.message || `System action executed for ${context.record?.name || 'record'}.`,
                    type: "success"
                });
            }
            break;

        case "create_task":
            await Todo.create({
                companyId,
                title: params.title || "Auto Task",
                description: params.description || "Automatically generated task.",
                assignedTo: params.userId || context.record?.assignedTo || context.record?.ownerId,
                dueDate: new Date(Date.now() + (params.daysOffset || 1) * 86400000),
                createdBy: context.userId,
                status: "pending",
                priority: "medium"
            });
            break;

        case "send_email":
            console.log(`[AUTOMATION] Sending Email to ${context.record?.email || params.to}: ${params.subject}`);
            // In a real system, you'd use nodemailer or a service like SendGrid here.
            break;

        case "update_lead_score":
            if (context.record && context.record.constructor.modelName === "Lead") {
                const { calculateLeadScore } = require("./leadManagement");
                await calculateLeadScore(context.record._id);
            }
            break;

        case "move_pipeline_stage":
            if (context.record && context.record.constructor.modelName === "Deal" && params.stageId) {
                const Deal = require("../models/Deal");
                const Stage = require("../models/Stage");
                const stage = await Stage.findOne({ _id: params.stageId, companyId: context.record.companyId });
                if (stage) {
                    await Deal.findByIdAndUpdate(context.record._id, { stageId: stage._id, stage: stage.name });
                }
            }
            break;

        default:
            console.warn(`Unknown action type: ${type}`);
    }
};

const getAdminUsers = async (companyId) => {
    const admins = await User.find({ companyId, role: "company_admin" }, "_id");
    return admins.map(a => a._id);
};

module.exports = { runAutomation };
