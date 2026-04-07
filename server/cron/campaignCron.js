const cron = require("node-cron");
const Campaign = require("../models/Campaign");
const messagingService = require("../services/messagingService");

/**
 * Initialize Campaign Scheduler (runs every minute)
 */
exports.initCampaignCron = () => {
    // Run every minute (0 * * * * *)
    cron.schedule("* * * * *", async () => {
        try {
            // Find campaigns that are ready to run: 
            // - status is SCHEDULED AND scheduledAt <= now
            // - OR status is RUNNING AND nextBatchAt <= now
            const now = new Date();
            const campaigns = await Campaign.find({
                status: { $in: ["SCHEDULED", "RUNNING"] },
                $or: [
                    { status: "SCHEDULED", scheduledAt: { $lte: now } },
                    { status: "RUNNING", nextBatchAt: { $lte: now } }
                ]
            });

            if (campaigns.length === 0) return;
            console.log(`[CAMPAIGN] Found ${campaigns.length} campaigns to process.`);

            for (const campaign of campaigns) {
                // If it was just SCHEDULED, mark as RUNNING
                if (campaign.status === "SCHEDULED") {
                    campaign.status = "RUNNING";
                    await campaign.save();
                }

                // Logic for sending a batch
                await processCampaignBatch(campaign);
            }
        } catch (err) {
            console.error("[CAMPAIGN CRON ERROR]", err.message);
        }
    });

    console.log("✅ Campaign Scheduler Initialized (1min checks)");
};

/**
 * Processes a single batch for a running campaign
 */
const processCampaignBatch = async (campaign) => {
    const effectiveRecipients = campaign.recipientMode === "MANUAL"
        ? (campaign.manualRecipients || [])
        : (campaign.recipients || []);
    const { processedCount, batchSize, delayBetweenBatches } = campaign;
    const startIndex = processedCount || 0;
    const endIndex = Math.min(startIndex + batchSize, effectiveRecipients.length);

    const batch = effectiveRecipients.slice(startIndex, endIndex);
    
    // Process messages in the batch one by one with a small 2-5 sec delay to avoid rate limits
    for (let i = 0; i < batch.length; i++) {
        const recipientId = batch[i];
        
        // Wait 2-5 seconds between each message
        const waitTime = Math.floor(Math.random() * (5000 - 2000 + 1)) + 2000;
        await new Promise(r => setTimeout(r, waitTime));

        await messagingService.processCampaignRecipient(campaign, recipientId);
    }

    // Update campaign progress
    const newProcessedCount = endIndex;
    
    if (newProcessedCount >= effectiveRecipients.length) {
        campaign.status = "COMPLETED";
        campaign.processedCount = newProcessedCount;
        campaign.nextBatchAt = null;
    } else {
        // Schedule next batch
        const nextBatchAt = new Date(Date.now() + (delayBetweenBatches || 10) * 60000);
        campaign.processedCount = newProcessedCount;
        campaign.nextBatchAt = nextBatchAt;
    }

    await campaign.save();
    console.log(`[CAMPAIGN] Campaign ${campaign._id} batch processed. Progress: ${newProcessedCount}/${recipients.length}`);
};
