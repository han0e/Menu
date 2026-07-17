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
    ko: '탈색 시술은 모발 손상(건조함, 끊어짐)이 불가피하게 발생할 수 있으며, 이후 일정 기간 동안 펌이나 매직 시술이 불가능할 수 있습니다.',
    en: 'Bleaching inevitably causes hair damage (dryness, breakage) and may prevent you from getting a perm or straightening treatment for a certain period.',
    zh: '漂发不可避免地会造成头发受损（干燥、断裂），且在一定时期内可能无法进行烫发或离子烫。'
  },
  {
    keywords: ['매직', '셋팅', '펌', '디지털', '히피'],
    ko: '고객님의 모발 손상도 및 굵기에 따라 컬의 탄력도나 유지 기간이 다를 수 있으며, 극손상모의 경우 시술이 제한될 수 있습니다.',
    en: 'Depending on the level of hair damage and thickness, the elasticity and duration of the curls may vary, and treatments may be restricted for severely damaged hair.',
    zh: '根据头发受损程度和粗细，卷曲的弹性和保持时间可能会有所不同，极度受损的头发可能会受到限制。'
  },
  {
    keywords: ['신데렐라'],
    ko: '신데렐라 클리닉(케라틴 코팅) 시술 후 약 2~3개월 동안은 펌이나 염색 시술 시 약액 침투가 방해되어 시술이 어려울 수 있습니다.',
    en: 'After the Cinderella Clinic (Keratin coating) treatment, perms or dyeing may be difficult for about 2-3 months as the penetration of chemicals is hindered.',
    zh: '在灰姑娘护理（角蛋白涂层）后约2~3个月内，可能会阻碍药液渗透，从而难以进行烫发或染发。'
  },
  {
    keywords: ['염색', '컬러'],
    ko: '현재 모발의 베이스 컬러(기존 염색/탈색 이력)에 따라 결과 색상이 샘플과 차이가 날 수 있으며, 두피가 민감하신 경우 약간의 따가움이 있을 수 있습니다.',
    en: 'Depending on your current base hair color (previous dye/bleach history), the resulting color may differ from the sample. If you have a sensitive scalp, you may experience a slight stinging sensation.',
    zh: '根据您目前的头发底色（以前的染发/漂发记录），结果颜色可能与样品有所不同。如果您的头皮敏感，可能会有轻微的刺痛感。'
  }
];

async function run() {
  const { data, error } = await supabase.from('menu_items').select('id, name_ko, warning_ko, warning_en, warning_zh');
  if (error) {
    console.error('Error fetching data (Did you run the SQL first?):', error);
    return;
  }

  let updatedCount = 0;
  for (const item of data) {
    if (!item.name_ko || (item.warning_en && item.warning_zh)) continue;

    let matchEn = null;
    let matchZh = null;
    for (const rule of WARNING_RULES) {
      if (rule.keywords.some(kw => item.name_ko.includes(kw))) {
        matchEn = rule.en;
        matchZh = rule.zh;
        break;
      }
    }

    if (matchEn && matchZh) {
      const { error: updateError } = await supabase.from('menu_items').update({ warning_en: matchEn, warning_zh: matchZh }).eq('id', item.id);
      if (updateError) {
        console.error(`Failed to update ${item.id}:`, updateError);
      } else {
        console.log(`Added EN/ZH warnings to [${item.name_ko}]`);
        updatedCount++;
      }
    }
  }

  console.log(`Updated ${updatedCount} items with EN/ZH warnings.`);
}

run();
