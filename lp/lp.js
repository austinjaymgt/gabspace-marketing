// Shared behaviour for paid-ad landing pages.

// Meta Pixel. Left empty on purpose: cookies.html and privacy.html don't yet
// disclose Meta tracking, so update those (and add consent if needed) before
// setting this. With it empty, no Meta script is loaded.
const META_PIXEL_ID = '';

const LP = document.body.dataset.lp;

if (META_PIXEL_ID) {
  !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
  n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
  document,'script','https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', META_PIXEL_ID);
  fbq('track', 'PageView');
}

// Carry ad attribution (utm_*, fbclid) into the signup app so a new account
// can be traced back to the ad and landing page that sent it.
const incoming = new URLSearchParams(location.search);
document.querySelectorAll('a[data-cta]').forEach(a => {
  const url = new URL(a.href);
  for (const [k, v] of incoming) {
    if ((k.startsWith('utm_') || k === 'fbclid') && !url.searchParams.has(k)) url.searchParams.set(k, v);
  }
  if (LP && !url.searchParams.has('lp')) url.searchParams.set('lp', LP);
  a.href = url.toString();
  a.addEventListener('click', () => {
    if (window.fbq) fbq('track', 'Lead', { content_name: LP });
  });
});

// Sticky CTA on mobile: appears once the hero button leaves the screen and
// hides again when the closing CTA is visible, so there's never two at once.
const sticky = document.querySelector('.sticky-cta');
const heroCta = document.querySelector('.hero-cta');
const finalCta = document.querySelector('.final');
if (sticky && heroCta && finalCta && 'IntersectionObserver' in window) {
  let heroVisible = true, finalVisible = false;
  const update = () => sticky.classList.toggle('show', !heroVisible && !finalVisible);
  new IntersectionObserver(([e]) => { heroVisible = e.isIntersecting || e.boundingClientRect.top > 0; update(); }).observe(heroCta);
  new IntersectionObserver(([e]) => { finalVisible = e.isIntersecting; update(); }).observe(finalCta);
}
