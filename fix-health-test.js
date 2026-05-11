const fs = require('fs');
let health = fs.readFileSync('Relay-main/tests/health.test.js', 'utf8');

// The memory says: "if tests fail due to missing MongoDB dependencies (e.g., 'mongoose', 'mongodb-memory-server'), permanently remove their legacy imports and initialization code rather than installing them, as the project has fully migrated to Supabase."

health = health.replace(/import mongoose from 'mongoose';\n/, '');
health = health.replace(/import \{ MongoMemoryServer \} from 'mongodb-memory-server';\n/, '');

health = health.replace(/let mongoServer;\n/, '');
health = health.replace(/beforeAll\(async \(\) => \{\n  mongoServer = await MongoMemoryServer\.create\(\);\n  const uri = mongoServer\.getUri\(\);\n  await mongoose\.connect\(uri\);\n\}\);\n/, '');
health = health.replace(/afterAll\(async \(\) => \{\n  await mongoose\.disconnect\(\);\n  await mongoServer\.stop\(\);\n\}\);\n/, '');

fs.writeFileSync('Relay-main/tests/health.test.js', health);
