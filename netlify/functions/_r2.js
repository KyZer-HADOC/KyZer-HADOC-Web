// Cloudflare R2 (S3-compatible) helper for files bigger than Supabase's 50 MB free-plan limit.
// Netlify env vars needed: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET
// Other S3-compatible hosts (e.g. Backblaze B2, no card needed): set R2_ENDPOINT (+ R2_REGION) instead of R2_ACCOUNT_ID.
// The AWS SDK is loaded lazily so normal (<=50 MB / link) uploads keep working even if
// `npm install` has not been run yet. Only big-file features need it.
const sdk = () => require("@aws-sdk/client-s3");
const getSignedUrl = (...a) => require("@aws-sdk/s3-request-presigner").getSignedUrl(...a);

function r2Configured() {
  return !!((process.env.R2_ACCOUNT_ID || process.env.R2_ENDPOINT) &&
    process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY && process.env.R2_BUCKET);
}

let _client;
function client() {
  if (!_client) {
    _client = new (sdk().S3Client)({
      region: process.env.R2_REGION || "auto", // R2 = "auto"; Backblaze B2 = e.g. "us-west-004"
      endpoint: process.env.R2_ENDPOINT || `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
    });
  }
  return _client;
}

const Bucket = () => process.env.R2_BUCKET;

// Browser uploads straight to this URL with a plain PUT (valid 1 hour).
const presignPut = (key) =>
  getSignedUrl(client(), new (sdk().PutObjectCommand)({ Bucket: Bucket(), Key: key }), { expiresIn: 3600 });

// Short-lived download link; `fileName` makes the browser save it with the original name.
const presignGet = (key, fileName, expiresIn = 120) =>
  getSignedUrl(client(), new (sdk().GetObjectCommand)({
    Bucket: Bucket(), Key: key,
    ResponseContentDisposition: fileName ? `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}` : undefined,
  }), { expiresIn });

async function headSize(key) {
  try {
    const r = await client().send(new (sdk().HeadObjectCommand)({ Bucket: Bucket(), Key: key }));
    return r.ContentLength || 0;
  } catch (e) { return null; }
}

const remove = (key) => client().send(new (sdk().DeleteObjectCommand)({ Bucket: Bucket(), Key: key })).catch(() => {});

module.exports = { r2Configured, presignPut, presignGet, headSize, remove };
