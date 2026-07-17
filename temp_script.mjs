import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load .env
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      process.env[match[1].trim()] = match[2].trim();
    }
  });
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const { data, error } = await supabase.from('menu_items').select('id, name_ko, time_ko, estimated_time');
  if (error) {
    console.error(error);
    return;
  }

  // Also update estimated_time using time_ko
  let updatedCount = 0;
  for (const item of data) {
    if (item.time_ko && !item.estimated_time) {
      let mins = 0;
      const hMatch = item.time_ko.match(/(\d+)시간/);
      const mMatch = item.time_ko.match(/(\d+)분/);
      if (hMatch) mins += parseInt(hMatch[1]) * 60;
      if (mMatch) mins += parseInt(mMatch[1]);
      
      if (mins > 0) {
        const { error: updateError } = await supabase.from('menu_items').update({ estimated_time: mins }).eq('id', item.id);
        if (updateError) {
          console.error(`Failed to update ${item.id}:`, updateError);
        } else {
          console.log(`Updated ${item.name_ko}: ${item.time_ko} -> ${mins}분`);
          updatedCount++;
        }
      }
    }
  }

  console.log(`Updated ${updatedCount} items.`);
}

run();
