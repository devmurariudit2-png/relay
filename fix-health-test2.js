const fs = require('fs');
let health = fs.readFileSync('Relay-main/tests/health.test.js', 'utf8');

health = health.replace(/beforeAll\(async \(\) => \{\n  mongoServer = await MongoMemoryServer\.create\(\);\n  const mongoUri = mongoServer\.getUri\(\);\n  await mongoose\.connect\(mongoUri\);\n\}\);\n/, '');

fs.writeFileSync('Relay-main/tests/health.test.js', health);
