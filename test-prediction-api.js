/**
 * Quick Test Script for AI Stock Prediction API
 * 
 * Run this to test the prediction API endpoint:
 * node test-prediction-api.js
 */

const testPrediction = async () => {
  console.log('🧪 Testing AI Stock Prediction API...\n');

  const testCases = [
    { symbol: 'NVDA', timeframe: '24h' },
    { symbol: 'AAPL', timeframe: '1w' },
    { symbol: 'TSLA', timeframe: '1m' }
  ];

  for (const testCase of testCases) {
    console.log(`📊 Testing ${testCase.symbol} (${testCase.timeframe})...`);
    
    try {
      const response = await fetch('http://localhost:3000/api/stock-prediction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testCase)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      console.log('✅ Success!');
      console.log(`   Symbol: ${data.symbol}`);
      console.log(`   Direction: ${data.prediction.direction.toUpperCase()}`);
      console.log(`   Confidence: ${data.prediction.confidence}%`);
      console.log(`   Target Price: $${data.prediction.targetPrice}`);
      console.log(`   Recommendation: ${data.prediction.recommendation.toUpperCase()}`);
      console.log(`   Source: ${data.source}`);
      console.log('');
      
    } catch (error) {
      console.error('❌ Error:', error.message);
      console.log('');
    }
  }

  console.log('🎉 Testing complete!');
};

// Run the test
testPrediction().catch(console.error);
