const { execSync } = require('child_process');

const backendEnv = {
    SUPABASE_URL: 'https://gwuybtstkhrybkivkawt.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    JWT_SECRET: process.env.JWT_SECRET || 'relay_secret_key_placeholder',
    FRONTEND_URL: 'https://frontend-iota-ten-31.vercel.app',
    NODE_ENV: 'production'
};

const frontendEnv = {
    VITE_API_URL: 'https://relay-backend-sigma.vercel.app',
    VITE_SUPABASE_URL: 'https://gwuybtstkhrybkivkawt.supabase.co',
    VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY
};

console.log('Fixing backend env vars...');
for (const [key, value] of Object.entries(backendEnv)) {
    try {
        const cmd = `cmd /c "npx vercel env add ${key} production --value ${value} --force --yes"`;
        execSync(cmd, { cwd: 'c:/Users/Administrator/Downloads/Relay-main/Relay-main' });
        console.log(`Updated ${key}`);
    } catch (e) {
        console.error(`Failed to update ${key}: ${e.message}`);
    }
}

console.log('Fixing frontend env vars...');
for (const [key, value] of Object.entries(frontendEnv)) {
    try {
        const cmd = `cmd /c "npx vercel env add ${key} production --value ${value} --force --yes"`;
        execSync(cmd, { cwd: 'c:/Users/Administrator/Downloads/Relay-main/frontend' });
        console.log(`Updated ${key}`);
    } catch (e) {
        console.error(`Failed to update ${key}: ${e.message}`);
    }
}
