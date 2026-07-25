// 환율 정보 유틸리티 (API fetch + localStorage caching + fallback)
const CACHE_KEY = "menu_exchange_rates_v1";
const CACHE_TIME_KEY = "menu_exchange_rates_time_v1";
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

// 기본 백업 환율 (1 KRW 기준)
const DEFAULT_RATES = {
  USD: 0.00072, // 1,000 KRW ≒ $0.72
  CNY: 0.0052, // 1,000 KRW ≒ ¥5.2
  JPY: 0.11, // 1,000 KRW ≒ ¥110
};

let cachedRatesMemory = null;

export async function getExchangeRates() {
  if (cachedRatesMemory) return cachedRatesMemory;

  try {
    const savedRates = localStorage.getItem(CACHE_KEY);
    const savedTime = localStorage.getItem(CACHE_TIME_KEY);
    const now = Date.now();

    if (savedRates && savedTime && now - Number(savedTime) < ONE_DAY_MS) {
      cachedRatesMemory = JSON.parse(savedRates);
      return cachedRatesMemory;
    }

    // open.er-api.com 무료 환율 API 요청
    const response = await fetch("https://open.er-api.com/v6/latest/KRW");
    if (!response.ok) throw new Error("Exchange API response not ok");

    const data = await response.json();
    if (data && data.rates) {
      const rates = {
        USD: data.rates.USD || DEFAULT_RATES.USD,
        CNY: data.rates.CNY || DEFAULT_RATES.CNY,
        JPY: data.rates.JPY || DEFAULT_RATES.JPY,
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(rates));
      localStorage.setItem(CACHE_TIME_KEY, String(now));
      cachedRatesMemory = rates;
      return rates;
    }
  } catch (error) {
    console.warn("Using default exchange rates fallback:", error);
  }

  cachedRatesMemory = DEFAULT_RATES;
  return DEFAULT_RATES;
}

/**
 * 원화 금액(KRW)을 수신하여 선택 언어에 맞는 대략적 환율 텍스트 생성
 * 예: currentLang 'en' -> "approx. $108"
 * 예: currentLang 'zh' -> "approx. ¥780"
 */
export function formatApproxCurrency(
  krwAmount,
  currentLang,
  rates = DEFAULT_RATES,
) {
  const amount = Number(krwAmount) || 0;
  if (amount <= 0) return null;

  const currentRates = rates || DEFAULT_RATES;

  if (currentLang === "en") {
    const usd = Math.round(amount * (currentRates.USD || DEFAULT_RATES.USD));
    return `approx. $${usd.toLocaleString()}`;
  }

  if (currentLang === "zh") {
    const cny = Math.round(amount * (currentRates.CNY || DEFAULT_RATES.CNY));
    return `约 ¥${cny.toLocaleString()}`;
  }

  return null;
}
