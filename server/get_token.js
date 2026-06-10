const OAuth = require('oauth-1.0a');
const crypto = require('crypto');
const axios = require('axios');
const readline = require('readline');
const open = require('open');

require('dotenv').config({ path: './.env' });

const TUMBLR_API_KEY = process.env.TUMBLR_API_KEY;
const TUMBLR_OAUTH_SECRET = process.env.TUMBLR_OAUTH_SECRET;

if (!TUMBLR_API_KEY || !TUMBLR_OAUTH_SECRET) {
  console.error('\n❌ ERROR: Missing credentials in .env file!');
  console.error('Please create server/.env with:');
  console.error('TUMBLR_API_KEY=your_consumer_key');
  console.error('TUMBLR_OAUTH_SECRET=your_consumer_secret\n');
  process.exit(1);
}

const oauth = OAuth({
  consumer: { key: TUMBLR_API_KEY, secret: TUMBLR_OAUTH_SECRET },
  signature_method: 'HMAC-SHA1',
  hash_function(base_string, key) {
    return crypto.createHmac('sha1', key).update(base_string).digest('base64');
  },
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function getRequestToken() {
  console.log('Getting request token from Tumblr...');
  
  const request_data = {
    url: 'https://www.tumblr.com/oauth/request_token',
    method: 'POST',
  };

  try {
    const response = await axios.post(request_data.url, null, {
      headers: oauth.toHeader(oauth.authorize(request_data)),
    });

    const params = new URLSearchParams(response.data);
    return {
      oauth_token: params.get('oauth_token'),
      oauth_token_secret: params.get('oauth_token_secret'),
    };
  } catch (error) {
    console.error('Failed to get request token:', error.response?.data || error.message);
    throw error;
  }
}

async function getAccessToken(oauth_token, oauth_token_secret, verifier) {
  console.log('Exchanging for access token...');
  
  const request_data = {
    url: 'https://www.tumblr.com/oauth/access_token',
    method: 'POST',
  };

  const token = {
    key: oauth_token,
    secret: oauth_token_secret,
  };

  const authHeader = oauth.toHeader(
    oauth.authorize(request_data, token)
  );

  try {
    const response = await axios.post(
      request_data.url,
      `oauth_verifier=${verifier}`,
      {
        headers: {
          ...authHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const params = new URLSearchParams(response.data);
    return {
      oauth_token: params.get('oauth_token'),
      oauth_token_secret: params.get('oauth_token_secret'),
    };
  } catch (error) {
    console.error('Failed to get access token:', error.response?.data || error.message);
    throw error;
  }
}

async function main() {
  try {
    const { oauth_token, oauth_token_secret } = await getRequestToken();

    const authUrl = `https://www.tumblr.com/oauth/authorize?oauth_token=${oauth_token}`;
    
    console.log('\n' + '='.repeat(70));
    console.log('Authorize the App');
    console.log('='.repeat(70));
    console.log('\n1. Opening browser for you to authorize...');
    console.log('2. Click "Allow" on the Tumblr page');
    console.log('3. After authorizing, you will see a blank page');
    console.log('4. Look at the URL bar - find "oauth_verifier=XXXXX"');
    console.log('5. Copy just the verifier code (the numbers after =)\n');
    
    try {
      await open(authUrl);
      console.log('Browser opened automatically!\n');
    } catch (err) {
      console.log(`Please open this URL in your browser:\n${authUrl}\n`);
    }
    
    rl.question(' Paste the oauth_verifier code here: ', async (verifier) => {
      if (!verifier || verifier.trim() === '') {
        console.error(' No verifier provided. Please run the script again.');
        rl.close();
        return;
      }
      
      const { oauth_token: access_token } = 
        await getAccessToken(oauth_token, oauth_token_secret, verifier.trim());

      console.log('\n' + '='.repeat(70));
      console.log('SUCCESS! Add these to your server/.env file:');
      console.log('='.repeat(70));
      console.log(`\nTUMBLR_API_KEY=${TUMBLR_API_KEY}`);
      console.log(`TUMBLR_OAUTH_TOKEN=${access_token}`);
      console.log(`TUMBLR_OAUTH_SECRET=${TUMBLR_OAUTH_SECRET}\n`);
      console.log('='.repeat(70));
      console.log('💡 Keep these credentials safe!');
      console.log('='.repeat(70));

      rl.close();
    });
  } catch (error) {
    console.error('\n Error:', error.message);
    rl.close();
  }
}

main();