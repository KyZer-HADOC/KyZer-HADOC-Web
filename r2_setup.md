# 200 MB uploads - setup (one time)

Mega CANNOT be used as the storage (it has no normal download/upload API for websites).
Mega links still work through the "Link" option on the upload form.

Pick ONE of these two storages. Both are S3-compatible and the code supports both.

## Option A - Backblaze B2 (no credit card needed as far as I know, free 10 GB)
1. backblaze.com -> sign up -> B2 Cloud Storage -> **Create a Bucket** (name e.g. `kyzer-files`, **Private**).
2. Bucket page shows **Endpoint** like `s3.us-west-004.backblazeb2.com` -> the region is the middle part (`us-west-004`).
3. **Application Keys -> Add a New Application Key** -> allow only that bucket, Read and Write -> copy **keyID** and **applicationKey** (shown once!).
4. CORS (so the browser can upload directly): bucket -> **CORS Rules** -> custom rule:
   - Origin: `https://kyzerhadoc.netlify.app`
   - Allowed operations: `s3_put`, `s3_get` (all S3 ops are fine)
   - Allowed headers: `*`
   - Max age: 3600
   (If the UI only offers "Share everything with every origin", that also works.)
5. Netlify -> Site settings -> Environment variables:
   - `R2_ENDPOINT` = `https://s3.us-west-004.backblazeb2.com`  (your endpoint)
   - `R2_REGION` = `us-west-004`  (your region)
   - `R2_ACCESS_KEY_ID` = keyID
   - `R2_SECRET_ACCESS_KEY` = applicationKey
   - `R2_BUCKET` = bucket name

## Option B - Cloudflare R2 (free 10 GB, but signup may ask for a card)
1. Cloudflare -> R2 Object Storage -> create a private bucket.
2. Bucket -> Settings -> CORS Policy:
```json
[{ "AllowedOrigins": ["https://kyzerhadoc.netlify.app"], "AllowedMethods": ["PUT", "GET"],
   "AllowedHeaders": ["*"], "ExposeHeaders": ["ETag"], "MaxAgeSeconds": 3600 }]
```
3. R2 -> Manage API Tokens -> Object Read & Write -> copy Access Key ID + Secret.
4. Netlify env vars: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`.

## Last steps
- Run `supabase_migration_links.sql` in Supabase SQL Editor (safe to run once; the site also works before you run it, but Links and big files need it).
- Redeploy the zip to Netlify.
