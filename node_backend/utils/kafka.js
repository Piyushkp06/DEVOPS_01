import { Kafka, Partitioners } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'devops-node-backend',
  brokers: [process.env.KAFKA_BROKERS || 'localhost:9092']
});

const producer = kafka.producer({
  createPartitioner: Partitioners.LegacyPartitioner
});

export const connectProducer = async () => {
  try {
    await producer.connect();
    console.log('✅ Kafka Producer connected successfully');
  } catch (error) {
    console.error('❌ Failed to connect Kafka Producer:', error);
  }
};

export const sendKafkaEvent = async (topic, message) => {
  try {
    await producer.send({
      topic,
      messages: [{ value: JSON.stringify(message) }]
    });
  } catch (error) {
    console.error(`❌ Failed to send Kafka message to topic ${topic}:`, error);
  }
};

const consumer = kafka.consumer({ groupId: 'node-backend-group' });

export const connectConsumer = async (topics, messageHandler) => {
  try {
    await consumer.connect();
    console.log('✅ Kafka Consumer connected successfully');

    for (const topic of topics) {
      await consumer.subscribe({ topic, fromBeginning: true });
    }

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const parsedMessage = JSON.parse(message.value.toString());
          await messageHandler(topic, parsedMessage);
        } catch (err) {
          console.error('Error handling Kafka message:', err);
        }
      },
    });
  } catch (error) {
    console.error('❌ Failed to connect Kafka Consumer:', error);
  }
};

export const disconnectKafka = async () => {
  await producer.disconnect();
  await consumer.disconnect();
};
