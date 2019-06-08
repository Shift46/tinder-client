import axios from 'axios';
import {
  generateToken,
} from 'tinder-access-token-generator';

import createHTTPClient from './createHTTPClient';

/**
 * https://github.com/fbessez/Tinder
 * https://gist.github.com/rtt/10403467
 */

const GENDERS = Object.freeze({
  male: 0,
  female: 1,
});

const GENDER_SEARCH_OPTIONS = Object.freeze({
  male: 0,
  female: 1,
  both: -1,
});

const SHARED_HEADERS = Object.freeze({
  app_version: '6.9.4',
  platform: 'ios',
  'User-Agent': 'Tinder/7.5.3 (iPhone; iOS 10.3.2; Scale/2.00)',
  Accept: 'application/json',
});

/*
AGRO_BACKEND-0  | { expires_in_sec: 508,
AGRO_BACKEND-0  |   login_request_code: '770464c0d65b7de1928ed388e0129c26',
AGRO_BACKEND-0  |   min_resend_interval_sec: 27,
AGRO_BACKEND-0  |   status: 'pending',
AGRO_BACKEND-0  |   privacy_policy: 'http://www.gotinder.com/privacy',
AGRO_BACKEND-0  |   terms_of_service: 'http://www.gotinder.com/terms' }
*/
async function requestSMS (phone) {
  const options = {
    method: 'POST',
    headers: SHARED_HEADERS,
    data: {},
    url: `https://graph.accountkit.com/v1.2/start_login?access_token=AA%7C464891386855067%7Cd1891abb4b0bcdfa0580d9b839f4a522&credentials_type=phone_number&fb_app_events_enabled=1&fields=privacy_policy%2Cterms_of_service&locale=fr_FR&phone_number=${encodeURIComponent(phone)}&response_type=token&sdk=ios`,
  };

  let result = await axios(options);

  return result.status === 200 ? result.data : null;
}

async function validateCode({confirmation_code, login_request_code, phone}) {
  let options = {
    method: 'POST',
    headers: SHARED_HEADERS,
    data: {},
    url: `https://graph.accountkit.com/v1.2/confirm_login?access_token=AA%7C464891386855067%7Cd1891abb4b0bcdfa0580d9b839f4a522&confirmation_code=${confirmation_code}&credentials_type=phone_number&fb_app_events_enabled=1&fields=privacy_policy%2Cterms_of_service&locale=fr_FR&login_request_code=${login_request_code}&phone_number=${phone}&response_type=token&sdk=ios`,
  };

  let result = await axios(options);

  options = {
    method: 'POST',
    headers: SHARED_HEADERS,
    data: JSON.stringify({'token': result.data.access_token, 'id': result.data.id, 'client_version': '9.0.1'}),
    url: `https://api.gotinder.com/v2/auth/login/accountkit`,
  };

  result = await axios(options);

  return result.data && result.data.data && result.data.data.api_token ? result.data.data.api_token : null;
}

async function createClientFromFacebookAccessToken(facebookAccessToken) {
  const loginResponse = await axios.post(
    'https://api.gotinder.com/v2/auth/login/facebook',
    {
      token: facebookAccessToken,
    },
  );
  return createHTTPClient(loginResponse.data.data.api_token);
}

async function createClientFromAccessToken(AccessToken) {
  return createHTTPClient(AccessToken);
}

async function createClientFromFacebookLogin({ emailAddress, password }) {
  const {
    apiToken,
  } = await generateToken({
    facebookEmailAddress: emailAddress,
    facebookPassword: password,
  });

  return createHTTPClient(apiToken);
}

export {
  createClientFromFacebookAccessToken,
  createClientFromFacebookLogin,
  requestSMS,
  validateCode,
  createClientFromAccessToken,
  GENDERS,
  GENDER_SEARCH_OPTIONS,
};
