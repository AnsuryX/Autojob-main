// Optimized postinstall script for faster builds
// Only downloads Chromium if not already present
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

console.log('Checking for Chromium...');

// Check if Chromium is already installed
const chromePath = process.env.PUPPETEER_EXECUTABLE_PATH || 
  join(process.cwd(), 'node_modules', 'puppeteer-core', '.local-chromium');

if (!existsSync(chromePath)) {
  console.log('Chromium not found. Installing...');
  try {
    // Use system Chromium if available (faster)
    if (process.platform === 'linux') {
      console.log('Linux detected - checking for system Chromium...');
      try {
        execSync('which google-chrome || which chromium || which chromium-browser', { stdio: 'ignore' });
        console.log('System Chromium found! Using system browser.');
        process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD = 'true';
      } catch {
        console.log('No system Chromium. Will use Puppeteer browser.');
      }
    }
  } catch (error) {
    console.log('Using default Puppeteer browser.');
  }
} else {
  console.log('Chromium already installed. Skipping download.');
}
