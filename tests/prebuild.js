import { execSync } from 'child_process';

console.log('=== RUNNING PREBUILD CHECKS ===');

// 1. Jalankan Svelte-check (Type & Syntax Check)
try {
	console.log('Running type check (svelte-check)...');
	execSync('npm run check', { stdio: 'inherit' });
} catch (error) {
	console.error('❌ Type check failed!');
	process.exit(1);
}

// 2. Deteksi apakah berjalan di Vercel
if (process.env.VERCEL) {
	console.log('⚠️ Lingkungan Vercel terdeteksi. Melewati (skipping) E2E Automation Test.');
	process.exit(0);
}

// 3. Jalankan E2E Test secara lokal
try {
	console.log('Running E2E Automation Tests locally...');
	execSync('npm run test:e2e', { stdio: 'inherit' });
	console.log('✅ All prebuild checks passed successfully!');
} catch (error) {
	console.error('❌ E2E Automation Tests failed!');
	process.exit(1);
}
