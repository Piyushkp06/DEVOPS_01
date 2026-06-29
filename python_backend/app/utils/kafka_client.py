import json
import logging
from kafka import KafkaProducer, KafkaConsumer
from app.core.config import settings

logger = logging.getLogger(__name__)

class KafkaManager:
    def __init__(self):
        self.producer = None
        self.consumer = None
        self.bootstrap_servers = settings.get("KAFKA_BROKERS", "localhost:9092")

    def connect_producer(self):
        try:
            self.producer = KafkaProducer(
                bootstrap_servers=self.bootstrap_servers,
                value_serializer=lambda v: json.dumps(v).encode('utf-8')
            )
            logger.info("✅ Kafka Producer connected successfully")
        except Exception as e:
            logger.error(f"❌ Failed to connect Kafka Producer: {e}")

    def send_event(self, topic: str, message: dict):
        if self.producer:
            try:
                self.producer.send(topic, message)
                self.producer.flush()
            except Exception as e:
                logger.error(f"❌ Failed to send Kafka message to topic {topic}: {e}")
        else:
            logger.warning("Kafka producer is not initialized.")

kafka_manager = KafkaManager()
