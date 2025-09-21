/* Install optional rollup native binding on Linux x64 during postinstall.
   This helps Vercel serverless functions avoid runtime MODULE_NOT_FOUND when AdminJS
   triggers rollup native loader. The script is safe to run on other platforms.
*/

const { execSync } = require('child_process');
const os = require('os');

try {
  const platform = os.platform();
  const arch = os.arch();
  // Vercel serverless uses Linux x64 (linux, x64). Only attempt when matching.
  if (platform === 'linux' && arch === 'x64') {
    console.log('Detected linux x64 — ensuring rollup native optional binding is installed');
    // The optional package name used by rollup follows @rollup/rollup-<platform>-<arch>-<libc?>
    // We'll try a couple of plausible names; missing installs will be ignored.
    const candidates = [
      '@rollup/rollup-linux-x64-gnu',
      '@rollup/rollup-linux-x64-musl',
      '@rollup/rollup-linux-x64'
    ];

    candidates.forEach((pkg) => {
      try {
        console.log('Attempting to install optional package:', pkg);
        execSync(`npm i --no-audit --no-fund --silent ${pkg}`, { stdio: 'inherit' });
        console.log('Successfully installed', pkg);
      } catch (e) {
        console.warn('Could not install', pkg, ' — continuing');
      }
    });
  } else {
    console.log('Non-linux/x64 platform detected — skipping rollup optional binder install');
  }
} catch (err) {
  console.warn('install-rollup-optional encountered an error, but continuing:', err && err.stack);
}
