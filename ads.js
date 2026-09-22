// Paste your AdSense publisher ID to turn ads on.
// Leave this empty until Google approves the site.
// No request is sent to googlesyndication.com while it is blank.
const ADSENSE_CLIENT = ""; // ca-pub-XXXXXXXX

// Display ad unit IDs from AdSense → Ads → By ad unit.
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

  mountAd("ad-primary", AD_SLOT_PRIMARY);
  mountAd("ad-secondary", AD_SLOT_SECONDARY);
}
