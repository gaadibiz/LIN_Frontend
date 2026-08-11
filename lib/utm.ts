// UTM parameter capture/retrieval — persists marketing attribution across the signup flow
const UTM_STORAGE_KEY = 'lin_utm';

export interface UtmParams {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmId?: string;
  utmTerm?: string;
  utmContent?: string;
}

const UTM_QUERY_PARAM_MAP: Record<keyof UtmParams, string> = {
  utmSource: 'utm_source',
  utmMedium: 'utm_medium',
  utmCampaign: 'utm_campaign',
  utmId: 'utm_id',
  utmTerm: 'utm_term',
  utmContent: 'utm_content',
};

interface ReadableSearchParams {
  get(name: string): string | null;
}

// Reads standard utm_* query params (Google/GA convention) and persists them for later API calls.
export function captureUtmParams(searchParams: ReadableSearchParams): void {
  if (typeof window === 'undefined') return;

  const utm: UtmParams = {};
  (Object.keys(UTM_QUERY_PARAM_MAP) as (keyof UtmParams)[]).forEach((key) => {
    const value = searchParams.get(UTM_QUERY_PARAM_MAP[key]);
    if (value) utm[key] = value;
  });

  if (Object.keys(utm).length > 0) {
    localStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(utm));
  }
}

export function getStoredUtmParams(): UtmParams | null {
  if (typeof window === 'undefined') return null;

  const stored = localStorage.getItem(UTM_STORAGE_KEY);
  if (!stored) return null;

  try {
    return JSON.parse(stored) as UtmParams;
  } catch {
    return null;
  }
}
