const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

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
  const { data, error } = await supabase
    .from('schedules')
    .select(`
      id,
      course_id,
      day,
      start_time,
      end_time,
      is_online,
      room_number,
      meeting_link,
      courses(
        name,
        code,
        profiles:lecturer_id(name)
      )
    `)
    .limit(1);

  if (error) {
    console.log('Error selecting schedules with courses and profiles:', error);
  } else {
    console.log('Successfully queried schedules with joined course and profiles! Data:', JSON.stringify(data, null, 2));
  }
}

main();
