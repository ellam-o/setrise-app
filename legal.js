/* Setrise NSE Terms of Use and Privacy Notice (English). DRAFT: have a Kenyan lawyer review it before you rely on it.
   Placeholders come from LEGAL in config.js. */
window.SN_LEGAL = function (L) {
  L = L || {};
  var op = L.operator || '[Your business or trading name]', mail = L.email || '[your contact email]', dt = L.effective || '11 November 2026';
  return {
    version: dt,
    summary: [
      'Setrise NSE is an educational tool. It is not investment advice and we are not a stockbroker or licensed investment adviser.',
      'Scores come from delayed public data and a scoring model. They can be wrong. You can lose money. Decisions are yours.',
      'Brokerage and CDS accounts are provided by the broker you choose (for example AIB-AXYS Africa), not by us. We never take your documents or money for share trading.',
      'Your watchlist and portfolio stay on your phone. We only ask for personal details if you join the waitlist or claim a promo.'
    ],
    sections: [
      { h: '1. About these terms', p: ['These Terms of Use and Privacy Notice (the Terms) apply when you use the Setrise NSE web app and its data feed (the App). The App is run by ' + op + ' (we, us). By tapping I agree, or by using the App, you accept the Terms. If you do not accept them, please do not use the App. Version dated ' + dt + '.'] },
      { h: '2. Information only, not advice', p: [
        'Setrise NSE gives general, educational information about companies listed on the Nairobi Securities Exchange (NSE). Scores, ratings such as "Strong candidate" or "Setup", reasons, movers, calendars and tools are the output of a rules-based scoring model applied to public data. They are not a recommendation, offer or solicitation to buy, sell or hold any security.',
        'We are not a licensed stockbroker, investment adviser, robo-adviser or fund manager, and we do not manage your money or portfolio. We do not know your goals, finances or risk tolerance. Speak to a licensed investment adviser before you invest.'] },
      { h: '3. Data and accuracy', p: [
        'Data comes from public sources, is often delayed, and can contain errors, gaps or stale values. Currency rates, tax figures and dividend dates are estimates. Always confirm prices, dividend dates, book-closure dates and tax treatment with the company, the NSE, your broker or the Kenya Revenue Authority.',
        'Scores describe past and current data. They do not predict future prices or returns. Past performance, including anything shown on the Track record page, does not guarantee future results, and early track-record figures rest on small samples.'] },
      { h: '4. Investment risk', p: ['Investing in shares involves risk, including losing some or all of your money. You alone are responsible for your investment decisions and their results. Only invest money you can afford to lose.'] },
      { h: '5. Brokers, CDS accounts and our referral', p: [
        'Brokerage accounts and CDS (Central Depository System) registrations are provided directly by the broker you choose, such as AIB-AXYS Africa, a stockbroker and Central Depository Agent licensed and regulated by the Capital Markets Authority (CMA) of Kenya. Setrise NSE is an independent platform. We do not open CDS accounts, process or hold your KYC documents, hold your money or shares, or route your orders.',
        'Links in the App take you to the broker\'s own website or app, where you create your account and give your documents to the broker directly. Broker terms, fees and approval decisions are the broker\'s. Please read them and check any broker\'s licence with the CMA before you register.',
        'Disclosure: we use a referral code with the broker. If you open an account using our link or code and trade, we may receive a share of the broker\'s commission. This does not add to what you pay us or, as far as we know, to your broker fees. Please confirm fees with the broker. You are free to open an account with any broker, with or without our code.'] },
      { h: '6. Plans, promo and access keys', p: [
        'Some features need a paid plan and an access key. Prices shown are in Kenya shillings. Founding prices apply to the first 100 people on the waitlist and may change afterwards. A new-member promo (currently ' + ((L.promoPct || 50)) + '% off a plan) applies only if you opened your broker account through our referral link and we are able to confirm it. We may decline a promo claim we cannot confirm, and we may change or end the promo at any time for new claimants.',
        'Payment is arranged directly with us, outside the App. [Refund and cancellation rule: add yours here, for example whether unused time is refundable.]',
        'An access key is personal to you. Do not share, sell or publish it. We may suspend a key that is shared or misused. Keys expire on the date shown in your account.'] },
      { h: '7. Using the App', p: ['You agree not to copy, scrape, resell or republish our scores, reasons or data feed, to try to break or overload the App, or to use it unlawfully. The App, its scoring method, text and design belong to us or our licensors. You may use them for your own personal, non-commercial use.'] },
      { h: '8. Your data and privacy', p: [
        'What stays on your phone: your watchlist, portfolio entries, language choice, access key and the last data you viewed are stored only in your phone\'s browser storage. We do not receive your portfolio or watchlist. Clearing the browser data or removing the App deletes them.',
        'What our server sees: when the App loads data, our feed receives your access key (if you entered one) so it can check that it is valid. Standard technical logs may be kept by Google, which hosts the feed, and by GitHub, which hosts the App.',
        'What we collect only if you choose to: if you join the waitlist (through our form) we collect the details you type in, such as name, email or phone. If you claim the promo, we may ask for your referral code and for confirmation that you opened your broker account through our link. With your consent we use these only to run the waitlist, issue and manage your key, and verify and apply your promo. We do not need, and ask you not to send us, your National ID, passport, KRA PIN, CDS documents, passwords, PINs or card details.',
        'Your rights: under the Kenya Data Protection Act, 2019 you may ask to see, correct or delete the personal data we hold about you, and withdraw consent, by writing to ' + mail + '. We keep personal data only as long as needed for these purposes and for legal and accounting reasons. If you are unhappy with how we handle your data you may complain to the Office of the Data Protection Commissioner (ODPC). We do not sell your personal data.'] },
      { h: '9. Links to other sites', p: ['The App links to third-party sites such as brokers, the CMA, app stores and calendars. We do not control them and are not responsible for their content, services or privacy practices.'] },
      { h: '10. Limits on our liability', p: ['To the fullest extent the law of Kenya allows, we are not liable for any loss, including trading losses or lost profits, arising from your use of, or reliance on, the App or its data, or from interruptions, delays or errors. The App is provided "as is" and "as available". Nothing in these Terms limits any right you have under Kenyan consumer law that cannot be excluded.'] },
      { h: '11. Changes and contact', p: ['We may update the App and these Terms. We will change the version date above and ask you to accept again if the change is important. Questions or data requests: ' + mail + '.'] },
      { h: '12. Governing law', p: ['These Terms are governed by the laws of Kenya, and the courts of Kenya have jurisdiction, unless the law gives you the right to go elsewhere. If any part of these Terms is found unenforceable, the rest still applies. The English version is the official one.'] }
    ]
  };
};
