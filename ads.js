// Publisher ID. Leave this empty to send no AdSense request.
const ADSENSE_CLIENT = "ca-pub-2388538564495463";

// Display ad unit IDs from AdSense → Ads → By ad unit.
// Leave both blank to use Auto ads instead of these two slots.
const AD_SLOT_PRIMARY = "";
const AD_SLOT_SECONDARY = "";

const ADS_ENABLED = Boolean(ADSENSE_CLIENT);

function mountAd(id, slot) {
  const host = document.getElementById(id);
  if (!host || !slot) return;

  const label = document.createElement("p");
  label.className = "ad-label";
  label.textContent = "Sponsored";

  const unit = document.createElement("ins");
  unit.className = "adsbygoogle";
  unit.style.display = "block";
  unit.setAttribute("data-ad-client", ADSENSE_CLIENT);
  unit.setAttribute("data-ad-slot", slot);
  unit.setAttribute("data-ad-format", "auto");
  unit.setAttribute("data-full-width-responsive", "true");

  host.replaceChildren(label, unit);
  host.hidden = false;
  (window.adsbygoogle = window.adsbygoogle || []).push({});
}

if (ADS_ENABLED) {
  const loader = document.createElement("script");
  loader.async = true;
  loader.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(ADSENSE_CLIENT)}`;
  loader.crossOrigin = "anonymous";
  document.head.append(loader);

  if (AD_SLOT_PRIMARY) mountAd("ad-primary", AD_SLOT_PRIMARY);
  if (AD_SLOT_SECONDARY) mountAd("ad-secondary", AD_SLOT_SECONDARY);

  if (!AD_SLOT_PRIMARY && !AD_SLOT_SECONDARY) {
    (window.adsbygoogle = window.adsbygoogle || []).push({
      google_ad_client: ADSENSE_CLIENT,
      enable_page_level_ads: true,
    });
  }
}
