const fs = require('fs');
const path = require('path');

// Read .env.local from the workspace root
const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim();
  }
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

async function main() {
  const url = `${supabaseUrl}/rest/v1/`;
  try {
    const res = await fetch(url, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });
    if (!res.ok) {
      console.error('HTTP Error:', res.status, res.statusText);
      return;
    }
    const schema = await res.json();
    const profilesDefinition = schema.definitions && schema.definitions.profiles;
    if (profilesDefinition) {
      console.log('Profiles table columns:', Object.keys(profilesDefinition.properties));
      console.log('Profiles properties:', profilesDefinition.properties);
    } else {
      console.log('Profiles definition not found in schema. Available definitions:', Object.keys(schema.definitions || {}));
    }
  } catch (err) {
    console.error('Error fetching schema:', err.message);
  }
}

main();
