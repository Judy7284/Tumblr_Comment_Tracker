const OAuth = require('oauth-1.0a');
const crypto = require('crypto');
const axios = require('axios');
const readline = require('readline');
const open = require('open');
const querystring = require('querystring');

require('dotenv').config({ path: './.env' });

const TUMBLR_API_KEY = process.env.TUMBLR_API_KEY;
const TUMBLR_OAUTH_SECRET = process.env.TUMBLR_OAUTH_SECRET;

if (!TUMBLR_API_KEY || !TUMBLR_OAUTH_SECRET) {
  console.error('\nERROR: Missing credentials in .env file!');
  console.error('Please create .env with:');
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
    const authHeader = oauth.toHeader(oauth.authorize(request_data));
    
    const response = await axios({
      method: 'POST',
      url: request_data.url,
      headers: {
        ...authHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const params = querystring.parse(response.data);
    return {
      oauth_token: params.oauth_token,
      oauth_token_secret: params.oauth_token_secret,
    };
  } catch (error) {
    console.error('Failed to get request token:', error.response?.data || error.message);
    throw error;
  }
}

async function getAccessToken(oauth_token, oauth_token_secret, verifier) {
  console.log('Exchanging for access token...');
  
  const token = {
    key: oauth_token,
    secret: oauth_token_secret,
  };

  const request_data = {
    url: 'https://www.tumblr.com/oauth/access_token',
    method: 'POST',
    data: { oauth_verifier: verifier }
  };

  try {
    const authHeader = oauth.toHeader(oauth.authorize(request_data, token));
    
    const response = await axios({
      method: 'POST',
      url: request_data.url,
      headers: {
        ...authHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      data: querystring.stringify({ oauth_verifier: verifier }),
    });

    const params = querystring.parse(response.data);
    return {
      oauth_token: params.oauth_token,
      oauth_token_secret: params.oauth_token_secret,
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
    console.log('AUTHORIZE THE APP');
    console.log('='.repeat(70));
    console.log('\n1. Copy this URL and paste it into your browser:');
    console.log('\n' + authUrl + '\n');
    console.log('2. Click "Allow" on the Tumblr page');
    console.log('3. After authorizing, you will see a blank page with a URL like:');
    console.log('   https://www.tumblr.com/blank?oauth_verifier=XXXXXX');
    console.log('4. Copy ONLY the verifier code (the numbers after oauth_verifier=)');
    console.log('\n' + '='.repeat(70));
    
    rl.question('\nPaste the oauth_verifier code here: ', async (verifier) => {
      if (!verifier || verifier.trim() === '') {
        console.error('No verifier provided. Please run the script again.');
        rl.close();
        return;
      }
      
      const { oauth_token: access_token, oauth_token_secret: access_secret } = 
        await getAccessToken(oauth_token, oauth_token_secret, verifier.trim());

      console.log('\n' + '='.repeat(70));
      console.log('SUCCESS! Add these to your .env file:');
      console.log('='.repeat(70));
      console.log(`\nTUMBLR_API_KEY=${TUMBLR_API_KEY}`);
      console.log(`TUMBLR_OAUTH_SECRET=${TUMBLR_OAUTH_SECRET}`);
      console.log(`TUMBLR_OAUTH_TOKEN=${access_token}`);
      console.log(`TUMBLR_ACCESS_TOKEN_SECRET=${access_secret}\n`);
      console.log('='.repeat(70));

      rl.close();
    });
  } catch (error) {
    console.error('\nError:', error.message);
    rl.close();
  }
}

main();