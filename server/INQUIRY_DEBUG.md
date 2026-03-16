# Why don’t I see inquiries from the website form?

Follow these steps in order.

---

## 1. Check that your API key is valid

Open in browser (replace with your real API key and base URL):

```
https://YOUR-CRM-URL/api/public/check?apiKey=69b85b25e94c4c2f28a8675f
```

- **If you see** `"success": true` and `companyName`  
  → The key is correct and the company is active. Go to step 2.

- **If you see** `"Company not found or inactive"`  
  → The key is wrong or the company is inactive.  
  → In MongoDB, open the `companies` collection, copy the `_id` of your company (24-character hex), and use that as `apiKey` in WordPress and in the URL above.  
  → Ensure the company has `status: "active"`.

- **If the page doesn’t load / connection error**  
  → The CRM server is not reachable at that URL (wrong host, port, or firewall). Fix the URL or server so this check URL loads.

---

## 2. Send a test inquiry from your machine

Run (replace URL and apiKey with yours):

```bash
curl -X POST "https://YOUR-CRM-URL/api/public/inquiry" \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_COMPANY_ID_24_CHARS" \
  -d "{\"name\":\"Test User\",\"email\":\"test@example.com\",\"phone\":\"9876543210\",\"message\":\"Test\"}"
```

- **If you get** `201` and `"success": true`  
  → The inquiry was created. Go to step 3.

- **If you get** `404` and "Company not found or inactive"  
  → Same as step 1: fix the API key (use Company `_id`) and company status.

- **If you get** `400` and "name, email, phone are required"  
  → Body must be JSON with at least `name`, `email`, `phone`.

- **If you get** connection error / timeout  
  → WordPress/server cannot reach the CRM URL. Check URL, firewall, and that the CRM server is running.

---

## 3. See the inquiry in the CRM

- Log in to the CRM with a user that belongs to **the same company** as the API key (same Company `_id`).
- Open **Inquiries** in the sidebar.
- You should see the test inquiry (and any from the website form).

If you still don’t see it:

- **Company_admin:** Should see all inquiries for their company.  
  → Confirm you’re logged in as a user whose `companyId` equals the API key (Company `_id`).
- **Branch_manager / Sales:** You now see inquiries for your branch **and** inquiries with no branch/assignment (including from the website).  
  → Restart the CRM server so the latest code (branch/assignedTo fix) is loaded, then refresh the Inquiries page.

---

## 4. WordPress

- Form submit URL must be exactly:  
  `https://YOUR-CRM-URL/api/public/inquiry`  
  (same base URL as in step 1).
- Header: `x-api-key: YOUR_COMPANY_ID` (same 24-char Company `_id`).
- Body: JSON with at least `name`, `email`, `phone` (and optionally `message`, `source`, `website`, `city`, `address`, `course`, `location`).

After a successful submit, check the CRM server logs. You should see:

`New Inquiry created: <id> for company: <companyId>`

If you see `Public inquiry rejected: Company not found or inactive`, fix the API key and company status as in step 1.
