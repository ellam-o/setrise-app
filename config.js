// Setrise NSE app settings. Edit this file only; no other file needs changing.
window.SETRISE_CONFIG = {
  // Paste the Web app URL from your Apps Script deployment (ends in /exec).
  // Leave empty to see the built-in DEMO data (illustrative, not real prices).
  API_URL: "https://script.google.com/macros/s/AKfycbwdt3IJ4bNsG-BGgbwNfBajbIWgeBJRvGg7V0r-766h-hE82tyX-xELIHY9mOxWKi5-TA/exec",
  SIGNUP_URL: "https://forms.gle/EbfkUYpbj4p79asJ8",   // your waitlist form
  TELEGRAM_URL: "",                                    // optional channel link, e.g. https://t.me/yourchannel
  WHATSAPP_URL: "",                                    // optional, e.g. https://wa.me/2547XXXXXXXX
  // Optional fallback currency rates (units of foreign currency per 1 KES), used only if the feed has none.
  // Example: FX_FALLBACK: { SAR: 0.029, AED: 0.0284, QAR: 0.0282 }
  FX_FALLBACK: {},
  // Brokers you recommend for opening a CDS account. The "Open a CDS account" page appears only when at least one has a name.
  // name: the broker's name. code: your referral code. url: the broker's sign-up or app link (optional). Keep the disclosure honest.
  BROKERS: [
    {
      name: "AIB-AXYS Africa (AIB DigiTrader)",
      code: "REF19149",
      links: [
        { label: "Open an account / Fungua akaunti", url: "https://aibaxys.kenyaonlinetrading.com/ActiveTrader/#!/new-trading-account?ReferralCode=REF19149" },
        { label: "iPhone: AIB DigiTrader", url: "https://apps.apple.com/app/id1481199787" },
        { label: "Android: AIB DigiTrader", url: "https://play.google.com/store/search?q=AIB%20DigiTrader&c=apps" },
        { label: "Broker website", url: "https://www.aib-axysafrica.com" }
      ],
      how_en: "Tap \"Open an account\" below. The sign-up page opens with our referral code already filled in, and it asks for valid KYC documents on the broker's own site. If the code box is empty, paste the code above. You can also install the AIB DigiTrader app and enter the code there.",
      how_sw: "Gusa \"Fungua akaunti\" hapa chini. Ukurasa wa kujisajili hufunguka na msimbo wetu wa rufaa tayari umejazwa, na huomba nyaraka halali za KYC kwenye tovuti ya dalali mwenyewe. Kisanduku cha msimbo kikiwa tupu, bandika msimbo ulio hapo juu. Unaweza pia kusakinisha programu ya AIB DigiTrader na kuweka msimbo huko."
    }
  ],
  SUPPORT_EMAIL: ""                                    // optional
};
