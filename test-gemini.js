const { GoogleGenerativeAI } = require('@google/generative-ai');

// Replace with your actual API key
const API_KEY = 'AIzaSyCPWP34_n5wdX4471wZolXYNcY_PBNgSQA';

const genAI = new GoogleGenerativeAI(API_KEY);

const modelsToTry = [
  'gemini-pro',
  'gemini-1.5-pro',
  'gemini-1.5-flash',
  'gemini-1.5-pro-latest',
  'gemini-1.5-flash-latest',
  'models/gemini-pro',
  'models/gemini-1.5-pro',
  'models/gemini-1.5-flash',
];

async function testModels() {
  console.log('Testing different model names...\n');
  
  for (const modelName of modelsToTry) {
    try {
      console.log(`Testing: ${modelName}...`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent('Say "test successful"');
      const response = await result.response;
      const text = response.text();
      console.log(`✅ SUCCESS! Model "${modelName}" works!`);
      console.log(`   Response: ${text.substring(0, 50)}...\n`);
    } catch (error) {
      console.log(`❌ Failed: ${error.message}\n`);
      if (modelName === 'gemini-pro') {
        console.log('Full error details:', error);
      }
    }
  }
}

testModels();
