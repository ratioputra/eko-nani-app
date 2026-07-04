const { createClient } = require('@supabase/supabase-js');
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

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase.rpc('get_table_columns', { table_name: 'profiles' });
  if (error) {
    // If RPC doesn't exist, select * and inspect keys
    const { data: selectData, error: selectError } = await supabase.from('profiles').select('*').limit(1);
    if (selectError) {
      console.log('Error selecting profiles:', selectError.message);
    } else if (selectData && selectData.length > 0) {
      console.log('Columns in profiles:', Object.keys(selectData[0]));
    } else {
      console.log('No profiles data found to inspect keys.');
    }
  } else {
    console.log('Columns from RPC:', data);
  }
}

main();
