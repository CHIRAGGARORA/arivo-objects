# Claude in Chrome prompt: SEO and measurement setup for arivoobjects.com

Paste everything below the line into Claude in Chrome. Be signed in first to
Vercel (team "ARIVO OBJECTS") and to the Google account that should own the
site's Search Console and Merchant Center.

---

You are setting up search visibility and traffic measurement for my online
store, ARIVO OBJECTS. The live site is https://www.arivoobjects.com: a
Next.js store on Vercel that sells handmade Jesmonite marble trays and soy wax
candle jar sets in India, priced in INR, with free shipping. The code is
already deployed with Vercel Web Analytics, product structured data and a
sitemap. Your job is the dashboard work in four parts, in order. Work in new
tabs, do not close my other tabs, and keep a short log of what you did and any
values you set.

Ground rules:
- Never enter payment details, buy anything, or start a paid plan or free
  trial that converts to paid. If a step requires payment, stop and tell me.
- Never change DNS, delete anything, change domains, or touch Deployment
  Protection, environment variables other than the one named below, or any
  other Vercel setting.
- If a page asks for business details you don't have (legal name, address,
  phone, GST number), stop and ask me. Do not invent them.
- If anything looks different from what I describe, describe what you see
  and ask before improvising.

## Part 1: Turn on Vercel Web Analytics

1. Go to https://vercel.com/arivo-objects/arivo-objects/analytics
2. If Web Analytics isn't enabled, click Enable. Choose the free (Hobby) option
   only. If it asks for a paid plan or Speed Insights add-on with a cost,
   don't enable that; tell me.
3. Confirm the Analytics page now shows it as enabled (waiting for data is
   fine).

## Part 2: Google Search Console

1. Go to https://search.google.com/search-console and click "Add property".
2. Choose the **URL prefix** type (not Domain) and enter exactly
   `https://www.arivoobjects.com/`
3. On the verification screen, pick the **HTML tag** method. It shows a tag like
   `<meta name="google-site-verification" content="XXXX" />`. Copy only the
   `XXXX` part (the content value). Do NOT click Verify yet.
4. In a new tab, go to
   https://vercel.com/arivo-objects/arivo-objects/settings/environment-variables
   and add an environment variable:
   - Key: `GOOGLE_SITE_VERIFICATION`
   - Value: the content value from step 3
   - Environments: Production only
   Save it.
5. Redeploy production so the tag is built into the pages: go to
   https://vercel.com/arivo-objects/arivo-objects/deployments, open the menu
   (⋯) on the most recent **Production** deployment that's "Ready", choose
   **Redeploy**, and confirm (leave "use existing build cache" unticked). Wait
   until the new deployment shows "Ready" (usually 1–3 minutes).
6. Open https://www.arivoobjects.com/ in a tab, view the page source
   (view-source:https://www.arivoobjects.com/) and confirm it contains
   `google-site-verification` with that value. If not, wait a minute and
   reload; if it still isn't there, stop and tell me.
7. Back in Search Console, click **Verify**.
8. Once verified, open **Sitemaps** in the left menu, submit `sitemap.xml`
   and confirm the status is "Success" (or "Couldn't fetch" just after
   submitting; note that and move on).
9. Open **URL inspection**, inspect `https://www.arivoobjects.com/` and click
   **Request indexing**. Do the same for
   `https://www.arivoobjects.com/shop` and each product page:
   - https://www.arivoobjects.com/products/small-oval-marble-tray
   - https://www.arivoobjects.com/products/large-cloud-marble-tray
   - https://www.arivoobjects.com/products/scented-candle-jar-pack-of-4
   - https://www.arivoobjects.com/products/mini-scented-candle-jar-pack-of-4
   If Google shows a daily quota message, stop requesting and note which were
   done.

## Part 3: Check the product rich results

1. Go to https://search.google.com/test/rich-results and test
   `https://www.arivoobjects.com/products/small-oval-marble-tray`
2. Report which items were detected (expect "Product snippets", "Merchant
   listings" and "Breadcrumbs") and copy any errors or warnings exactly.
   Warnings about missing "transitTime" or optional fields are expected; just
   list them.

## Part 4: Google Merchant Center (free Shopping listings)

1. Go to https://merchants.google.com and start creating a free Merchant
   Center account with the same Google account. If it offers to link the
   Search Console property from Part 2, accept; that verifies the website.
2. Use these details:
   - Business name: ARIVO OBJECTS
   - Website: https://www.arivoobjects.com
   - Country: India, currency INR, language English
   - Where customers can buy: on my website
3. **Stop and ask me** before entering any business address, phone number,
   or contact email. (The site doesn't show a contact email yet, and Merchant
   Center requires one, so I need to give you the details.)
4. For adding products, choose the option to **add products automatically
   from your website** (Google reads the product data already on the pages).
   Do not set up a paid feed app or Google Ads campaign.
5. Shipping: if asked, set India, free shipping (₹0), handling time 0–2
   business days, and ask me for the transit time.
6. Returns: if asked, the policy is no returns for change of mind; damaged or
   incorrect items are replaced or refunded on contact. Policy page:
   https://www.arivoobjects.com/shipping-returns
7. Skip any "Performance Max", "Google Ads", or "boost with ads" offers.

## When you're done

Give me a short report:
- Vercel Web Analytics: enabled? (yes/no)
- Search Console: verified? sitemap status? which URLs had indexing requested?
- Rich results test: detected items and any errors/warnings (quoted)
- Merchant Center: account created? what's left and what you need from me?
- Anything you couldn't do and why.
