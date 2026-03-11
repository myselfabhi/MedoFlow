import { chatCompletion } from './src/services/aiProviderService';

async function main() {
    console.log('Testing Ollama direct connection...');
    try {
        const result = await chatCompletion({
            systemPrompt: 'You are a raw JSON API. Your task is to extract a patient summary from the transcript.',
            userMessage: 'The patient complained of a headache and was prescribed Tylenol.',
            jsonMode: true,
        });
        console.log('✅ Connection Success!');
        console.log('Result:', result);
    } catch (err) {
        console.error('❌ Connection Failed:', err);
    }
}

main();
