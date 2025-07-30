const fs = require('fs');

// Test credentials
const PRIVATE_KEY = '2a975a6e86c98d3e96927ba685f2e45a7df6363596e30df574c7901f2e2e6cc9';
const ACCOUNT_ADDRESS = '0x71197e7a1CA5A2cb2AD82432B924F69B1E3dB123';

// Read contract files
const moveCode = fs.readFileSync('./test-contracts/counter.move', 'utf8');
const solidityCode = fs.readFileSync('./test-contracts/Counter.sol', 'utf8');

console.log('🧪 Testing Umi Playground Deployment');
console.log('=====================================');
console.log(`Private Key: ${PRIVATE_KEY.substring(0, 10)}...`);
console.log(`Account Address: ${ACCOUNT_ADDRESS}`);
console.log('');

// Test Move Deployment
async function testMoveDeployment() {
  console.log('🚀 Testing Move Deployment...');
  
  const response = await fetch('http://localhost:3000/api/deploy-move', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      code: moveCode,
      privateKey: PRIVATE_KEY,
      accountAddress: ACCOUNT_ADDRESS
    })
  });

  const result = await response.json();
  console.log('Move Deployment Result:', result);
  console.log('');
}

// Test EVM Deployment
async function testEVMDeployment() {
  console.log('🚀 Testing EVM Deployment...');
  
  const response = await fetch('http://localhost:3000/api/deploy-evm', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      code: solidityCode,
      privateKey: PRIVATE_KEY
    })
  });

  const result = await response.json();
  console.log('EVM Deployment Result:', result);
  console.log('');
}

// Run tests
async function runTests() {
  try {
    await testMoveDeployment();
    await testEVMDeployment();
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

runTests(); 