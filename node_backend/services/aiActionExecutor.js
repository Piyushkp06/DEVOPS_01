import { restartDeployment, scaleDeployment, rollbackDeployment } from '../utils/k8s.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const handleAiAction = async (payload) => {
    try {
        console.log("🤖 Received Autonomous Action from AI:", payload);
        const { incidentId, action, summary } = payload;

        if (!action || !action.action_type) {
            console.log("⚠️ No actionable struct found in payload.");
            return;
        }

        const logAction = async (status, details) => {
            if (incidentId) {
                await prisma.action.create({
                    data: {
                        incidentId: parseInt(incidentId),
                        actionType: action.action_type,
                        status,
                        executedBy: 'AI-Agent',
                        details: details || summary
                    }
                });
            }
        };

        switch (action.action_type) {
            case 'restart_pod':
            case 'restart_deployment':
                await restartDeployment(action.payload.deployment_name, action.payload.namespace || 'default');
                await logAction('success', `AI restarted deployment ${action.payload.deployment_name}. Reasong: ${summary}`);
                break;
            case 'rollback_deployment':
                await rollbackDeployment(action.payload.deployment_name, action.payload.namespace || 'default');
                await logAction('success', `AI rolled back deployment ${action.payload.deployment_name}`);
                break;
            case 'scale_up':
                // Assuming payload contains { deployment_name, replicas: 3 }
                await scaleDeployment(action.payload.deployment_name, action.payload.namespace || 'default', action.payload.replicas || 3);
                await logAction('success', `AI scaled up deployment ${action.payload.deployment_name} to ${action.payload.replicas}`);
                break;
            case 'notify_slack':
                console.log(`[SLACK ALERT] AI Agent message: ${summary}`);
                await logAction('success', `Notified Slack: ${summary}`);
                break;
            default:
                console.log(`⚠️ Unrecognized action type: ${action.action_type}`);
                await logAction('failed', `Unrecognized action type: ${action.action_type}`);
        }
        console.log(`✅ AI Action ${action.action_type} executed successfully!`);
    } catch (err) {
        console.error("❌ Failed to execute AI action:", err);
    }
};