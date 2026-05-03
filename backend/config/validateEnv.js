/**
 * Validates required env before accepting traffic.
 * Keeps deployments from starting half-configured (74% → production-safe).
 */

function validateEnv() {
  const prod = process.env.NODE_ENV === 'production';
  const errors = [];

  if (!process.env.MONGODB_URI || String(process.env.MONGODB_URI).trim().length === 0) {
    errors.push('MONGODB_URI is required (MongoDB connection string).');
  }

  if (!process.env.JWT_SECRET || String(process.env.JWT_SECRET).trim().length === 0) {
    errors.push('JWT_SECRET is required.');
  } else if (prod && process.env.JWT_SECRET.length < 32) {
    errors.push(
      `JWT_SECRET must be at least 32 characters in production (currently ${process.env.JWT_SECRET.length}).`
    );
  }

  if (prod && (!process.env.ALLOWED_ORIGINS || process.env.ALLOWED_ORIGINS.trim().length === 0)) {
    console.warn(
      '\n⚠️  ALLOWED_ORIGINS is empty — CORS defaults to permissive (*. Set comma-separated origins for production.)\n'
    );
  }

  const cn = process.env.CLOUDINARY_CLOUD_NAME;
  if (
    prod &&
    (!cn ||
      cn === 'your_cloud_name' ||
      cn === 'dummy' ||
      String(process.env.CLOUDINARY_API_KEY || '').length < 5)
  ) {
    console.warn(
      '\n⚠️  Cloudinary not fully configured — uploads fall back to /uploads on disk (often ephemeral on PaaS). Set CLOUDINARY_* vars.\n'
    );
  }

  if (errors.length > 0) {
    console.error('\n❌ Environment validation failed:\n');
    errors.forEach((e) => console.error(`   • ${e}`));
    console.error('');
    process.exit(1);
  }

  console.log('✓ Environment validated (JWT + MongoDB)');
}

module.exports = { validateEnv };
