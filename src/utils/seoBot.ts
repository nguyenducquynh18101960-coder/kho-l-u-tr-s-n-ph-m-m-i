export function isSearchEngineBot(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /Googlebot|Google-InspectionTool|AdsBot-Google|Mediapartners-Google|Storebot-Google|APIs-Google|GoogleOther|bingbot|Slurp|DuckDuckBot|Baiduspider|YandexBot|Sogou|Exabot|facebot|facebookexternalhit|ia_archiver|Applebot|Twitterbot|LinkedInBot|TelegramBot|Zalo|Pinterestbot|Discordbot|Slackbot|Lighthouse|PTST/i.test(
    ua
  );
}

const DEFAULT_TITLE = 'Max10 AI - Gia sư điểm 10 THCS';
const DEFAULT_DESCRIPTION =
  'Max10 AI - Gia sư điểm 10 THCS cho học sinh lớp 6, 7, 8, 9: giải bài tập Toán, Văn, Anh, KHTN từng bước, luyện đề thi và sơ đồ tư duy AI miễn phí.';
const DEFAULT_KEYWORDS =
  'Max10 AI - Gia sư điểm 10 THCS, Max10 AI, gia sư điểm 10 THCS, gia sư AI THCS, giải bài tập Toán Văn Anh KHTN lớp 6 7 8 9, luyện thi vào 10, sơ đồ tư duy AI';

function ensureMetaTag(attrName: 'name' | 'property', attrValue: string, content: string) {
  if (typeof document === 'undefined') return;
  let el = document.querySelector(`meta[${attrName}="${attrValue}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attrName, attrValue);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

export function syncHomepageSeoMeta(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  try {
    document.title = DEFAULT_TITLE;
    const currentUrl = window.location.origin + window.location.pathname;
    const bannerUrl = `${window.location.origin}/max10-og-banner.jpg`;

    ensureMetaTag('name', 'title', DEFAULT_TITLE);
    ensureMetaTag('name', 'description', DEFAULT_DESCRIPTION);
    ensureMetaTag('name', 'keywords', DEFAULT_KEYWORDS);
    ensureMetaTag(
      'name',
      'robots',
      'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
    );
    ensureMetaTag(
      'name',
      'googlebot',
      'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
    );

    ensureMetaTag('property', 'og:type', 'website');
    ensureMetaTag('property', 'og:locale', 'vi_VN');
    ensureMetaTag('property', 'og:site_name', DEFAULT_TITLE);
    ensureMetaTag('property', 'og:title', DEFAULT_TITLE);
    ensureMetaTag('property', 'og:description', DEFAULT_DESCRIPTION);
    ensureMetaTag('property', 'og:url', currentUrl);
    ensureMetaTag('property', 'og:image', bannerUrl);

    ensureMetaTag('name', 'twitter:card', 'summary_large_image');
    ensureMetaTag('name', 'twitter:title', DEFAULT_TITLE);
    ensureMetaTag('name', 'twitter:description', DEFAULT_DESCRIPTION);
    ensureMetaTag('name', 'twitter:url', currentUrl);
    ensureMetaTag('name', 'twitter:image', bannerUrl);

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', currentUrl);
  } catch {
    // Ignore DOM mutation errors in restricted environments
  }
}
