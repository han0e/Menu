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

const WARNING_RULES = [
  {
    keywords: ['블리치', '투톤', '그라데이션'],
    warning: '탈색 시술은 모발 손상(건조함, 끊어짐)이 불가피하게 발생할 수 있으며, 이후 일정 기간 동안 펌이나 매직 시술이 불가능할 수 있습니다.'
  },
  {
    keywords: ['매직', '셋팅', '펌', '디지털', '히피'],
    warning: '고객님의 모발 손상도 및 굵기에 따라 컬의 탄력도나 유지 기간이 다를 수 있으며, 극손상모의 경우 시술이 제한될 수 있습니다.'
  },
  {
    keywords: ['신데렐라'],
    warning: '신데렐라 클리닉(케라틴 코팅) 시술 후 약 2~3개월 동안은 펌이나 염색 시술 시 약액 침투가 방해되어 시술이 어려울 수 있습니다.'
  },
  {
    keywords: ['염색', '컬러'],
    warning: '현재 모발의 베이스 컬러(기존 염색/탈색 이력)에 따라 결과 색상이 샘플과 차이가 날 수 있으며, 두피가 민감하신 경우 약간의 따가움이 있을 수 있습니다.'
  }
];

async function run() {
  const { data, error } = await supabase.from('menu_items').select('id, name_ko, warning_text');
  if (error) {
    console.error(error);
    return;
  }

  let updatedCount = 0;
  for (const item of data) {
    if (!item.name_ko || item.warning_text) continue; // Skip if already has warning

    let appliedWarning = null;
    for (const rule of WARNING_RULES) {
      if (rule.keywords.some(kw => item.name_ko.includes(kw))) {
        appliedWarning = rule.warning;
        break; // Match first rule
      }
    }

    if (appliedWarning) {
      const { error: updateError } = await supabase.from('menu_items').update({ warning_text: appliedWarning }).eq('id', item.id);
      if (updateError) {
        console.error(`Failed to update ${item.id}:`, updateError);
      } else {
        console.log(`Added warning to [${item.name_ko}]`);
        updatedCount++;
      }
    }
  }

  console.log(`Updated ${updatedCount} items with warnings.`);
}

run();
