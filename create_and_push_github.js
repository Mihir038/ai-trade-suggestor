const { execSync } = require('child_process');
const https = require('https');

function getGitCredential() {
  const input = 'protocol=https\nhost=github.com\n\n';
  const out = execSync('git credential fill', { input, encoding: 'utf8' });
  const lines = out.split('\n');
  let username = '';
  let token = '';
  for (const line of lines) {
    if (line.startsWith('username=')) username = line.substring(9).trim();
    if (line.startsWith('password=')) token = line.substring(9).trim();
  }
  return { username, token };
}

const { username, token } = getGitCredential();

function githubRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const payload = data ? JSON.stringify(data) : null;
    const req = https.request(`https://api.github.com${path}`, {
      method,
      headers: {
        'Authorization': `token ${token}`,
        'User-Agent': 'Antigravity-Agent',
        'Accept': 'application/vnd.github.v3+json',
        ...(payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {})
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function main() {
  console.log(`Checking repository for ${username}...`);
  const repoName = 'ai-trade-suggestor';

  // 1. Check if repository already exists
  let check = await githubRequest('GET', `/repos/${username}/${repoName}`);
  if (check.status === 404) {
    console.log(`Creating public repository '${repoName}' on GitHub...`);
    const createRes = await githubRequest('POST', '/user/repos', {
      name: repoName,
      description: 'AI Trade Suggestor & Institutional Trading Journal - Live charts, approved trades collage, NSE option chain scanner, and execution lifecycle manager.',
      private: false,
      has_issues: true,
      has_projects: true,
      has_wiki: true
    });
    console.log(`Repository creation status: ${createRes.status}`);
    if (createRes.status !== 201) {
      console.error('Failed to create repo:', createRes.data);
      process.exit(1);
    }
  } else {
    console.log(`Repository ${username}/${repoName} already exists.`);
  }

  // 2. Initialize local git repo if not already initialized
  try {
    execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' });
  } catch {
    console.log('Initializing local git repository...');
    execSync('git init', { stdio: 'inherit' });
    execSync('git branch -M main', { stdio: 'inherit' });
  }

  // 3. Configure remote
  const remoteUrl = `https://${token}@github.com/${username}/${repoName}.git`;
  try {
    execSync('git remote remove origin', { stdio: 'ignore' });
  } catch {}
  execSync(`git remote add origin ${remoteUrl}`, { stdio: 'inherit' });

  // 4. Stage and commit
  console.log('Staging files...');
  execSync('git add .', { stdio: 'inherit' });
  
  try {
    console.log('Committing changes...');
    execSync('git commit -m "feat: AI Trade Intelligence Platform with Option Chain, Trades Hub, and Live Collage"', { stdio: 'inherit' });
  } catch (e) {
    console.log('Commit note:', e.message);
  }

  // 5. Push to GitHub
  console.log('Pushing to GitHub main branch...');
  execSync('git push -u origin main --force', { stdio: 'inherit' });
  console.log(`Successfully pushed to https://github.com/${username}/${repoName}`);

  // 6. Reset remote origin URL to clean HTTPS (without embedding token in git config)
  execSync(`git remote set-url origin https://github.com/${username}/${repoName}.git`, { stdio: 'inherit' });

  // 7. Enable GitHub Pages using GitHub Actions
  console.log('Configuring GitHub Pages with GitHub Actions...');
  try {
    const pagesRes = await githubRequest('POST', `/repos/${username}/${repoName}/pages`, {
      build_type: 'workflow'
    });
    console.log('GitHub Pages status:', pagesRes.status);
  } catch (e) {
    console.log('Pages config notice:', e.message);
  }

  console.log('ALL DONE!');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
