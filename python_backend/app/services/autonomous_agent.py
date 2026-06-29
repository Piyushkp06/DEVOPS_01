import json
import logging
import asyncio
from kafka import KafkaConsumer
from app.core.config import settings
from app.services.analyzer import _get_groq_analysis
from app.services.data_fetcher import fetch_comprehensive_data
from app.utils.prompts import build_comprehensive_analysis_prompt
from app.utils.kafka_client import kafka_manager

logger = logging.getLogger(__name__)

class AutonomousDevOpsAgent:
    def __init__(self):
        self.bootstrap_servers = settings.get("KAFKA_BROKERS", "localhost:9092")
        self.consumer = None

    def start_listening(self):
        try:
            self.consumer = KafkaConsumer(
                'incident-alerts',
                'system-logs',
                bootstrap_servers=self.bootstrap_servers,
                value_deserializer=lambda v: json.loads(v.decode('utf-8')),
                group_id='ai-devops-agent'
            )
            logger.info("🤖 Autonomous DevOps Agent started listening to Kafka...")
            
            # Start consumer loop in background
            asyncio.create_task(self._consume_loop())
        except Exception as e:
            logger.error(f"❌ Failed to start Autonomous Agent consumer: {e}")

    async def _consume_loop(self):
        # We use a thread executor for blocking kafka consumer
        loop = asyncio.get_event_loop()
        while True:
            try:
                # Poll for messages
                messages = await loop.run_in_executor(None, self.consumer.poll, 1.0)
                for topic_partition, records in messages.items():
                    for record in records:
                        await self.process_event(record.topic, record.value)
            except Exception as e:
                logger.error(f"Error in consumer loop: {e}")
                await asyncio.sleep(5)

    async def process_event(self, topic: str, event_data: dict):
        logger.info(f"⚡ [Autonomous Agent] Received event on {topic}: {event_data}")
        
        # Determine if we should act automatically
        severity = event_data.get("severity", "low").lower()
        if severity not in ["high", "critical"] and topic != "incident-alerts":
            return # Ignore low severity for automatic actions

        log_id = event_data.get("logId")
        incident_id = event_data.get("incidentId") or event_data.get("id")

        logger.info(f"🕵️ Analyzing event automatically...")
        try:
            # Fetch context
            comprehensive_data = await fetch_comprehensive_data(log_id, incident_id)
            if not any(comprehensive_data.values()):
                 # Dummy fallback
                 comprehensive_data = {"incident": event_data}

            # Enforce JSON structured output from LLM for actions
            system_injection = (
                "You are an Autonomous AI DevOps Engineer acting instantly. "
                "Output your response strictly as JSON with two keys: "
                "\"analysis_summary\" (string, what happened) and \"recommended_action\" (object with 'action_type' and 'payload', or null if no action needed). "
                "Allowed action_types: 'restart_pod', 'rollback_deployment', 'scale_up', 'notify_slack'."
            )
            
            prompt = build_comprehensive_analysis_prompt(comprehensive_data)
            prompt = system_injection + "\n\n" + prompt

            analysis_result = await _get_groq_analysis(prompt, "comprehensive")
            
            # Try to parse the JSON
            try:
                parsed_result = json.loads(analysis_result)
                summary = parsed_result.get("analysis_summary", "")
                action = parsed_result.get("recommended_action")

                logger.info(f"📋 AI Summary: {summary}")

                if action:
                    logger.info(f"🛠️ AI Dictated Action: {action}")
                    # Dispatch to Kafka so Node.js can execute it!
                    kafka_manager.send_event('ai-actions', {
                        "incidentId": incident_id,
                        "action": action,
                        "summary": summary
                    })
            except json.JSONDecodeError:
                logger.warning(f"⚠️ AI did not return structured JSON. Raw response: {analysis_result[:200]}")
        except Exception as e:
            logger.error(f"❌ Autonomous processing failed: {e}")

autonomous_agent = AutonomousDevOpsAgent()
