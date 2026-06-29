import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'test-client',
  brokers: ['localhost:29092']
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'test-group' });

async function runTest() {
  try {
    console.log("🔄 Connecting to Kafka...");
    await producer.connect();
    await consumer.connect();

    console.log("🎧 Listening for AI responses on 'ai-actions' topic...");
    await consumer.subscribe({ topic: 'ai-actions', fromBeginning: false });

    consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        console.log("\n✅ SUCCESS: Received AI Action from Python Backend!");
        console.log("Topic:", topic);
        console.log("Payload:", JSON.parse(message.value.toString()));
        console.log("\n🏁 Test complete. Exiting...");
        process.exit(0);
      },
    });

    const mockIncident = {
      id: 9999,
      severity: "critical",
      title: "High Memory Usage in Redis cache",
      description: "Redis container memory is bursting at 99%. Pods are restarting.",
      logId: null
    };

    console.log("\n🚀 Triggering fake critical incident...");
    console.log("Sending to 'incident-alerts':", mockIncident);
    
    await producer.send({
      topic: 'incident-alerts',
      messages: [
        { value: JSON.stringify(mockIncident) }
      ],
    });

    console.log("⏳ Waiting for AI analysis... (Timeout in 30 seconds)\n");

    // Timeout fallback
    setTimeout(() => {
        console.log("❌ Test timed out. Make sure all dockers are running, Groq API key is set, and Kafka is available.");
        process.exit(1);
    }, 30000);

  } catch (error) {
    console.error("Test failed:", error);
    process.exit(1);
  }
}

runTest();
