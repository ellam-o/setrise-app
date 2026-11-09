SETRISE NASE APP  (installable web app, free to host)
Rise with reasons.

WHAT THIS FOLDER IS
Plain HTML, CSS and JavaScript. No build step. It shows your scores on a phone and installs
like an app. It reads a small data feed published by your Apps Script (NASE_Publish.gs).

TRY IT FIRST (demo data)
Host the folder as is. With API_URL empty in config.js the app shows clearly labelled DEMO data.

CONNECT YOUR REAL DATA
1. Add NASE_Publish.gs to your Apps Script project and follow its setup notes
   (add the "webapp" block to appsscript.json, then Deploy > New deployment > Web app,
   Execute as Me, Anyone can access). Copy the Web app URL ending in /exec.
2. Open config.js and paste it into API_URL. Save.
3. Re-upload config.js to your host.
4. To give someone full access: in your sheet run createAccessKey, send them the key.
   They open the app > Account > enter the key.

HOST IT FREE (pick one)
A) GitHub Pages: create a public repo, upload everything in this folder, then
   Settings > Pages > Deploy from branch (main, root). Your app is at
   https://<username>.github.io/<repo>/
B) Cloudflare Pages: Workers & Pages > Create > Pages > Upload assets, drag this folder in.
Both give you HTTPS, which the install feature needs.

INSTALL ON A PHONE
Android Chrome: open the link > menu > Install app.  iPhone Safari: Share > Add to Home Screen.

AFTER YOU CHANGE A FILE
Bump VERSION in sw.js (for example sn-v2) so phones pick up the new files.

NOT INCLUDED YET
Push notifications, M-Pesa payment, and login accounts. Access today is by key you issue.
