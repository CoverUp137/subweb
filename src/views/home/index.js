const TEXT_PARAMETERS = ['include', 'exclude', 'group', 'filename', 'interval', 'dev_id', 'rename'];
const BASE64_PARAMETERS = ['groups', 'ruleset'];
const BOOLEAN_PARAMETERS = [
  'emoji',
  'add_emoji',
  'remove_emoji',
  'append_type',
  'tfo',
  'udp',
  'list',
  'sort',
  'sort_script',
  'script',
  'insert',
  'scv',
  'fdn',
  'expand',
  'append_info',
  'prepend',
  'classic',
  'tls13',
  'provider_proxy_direct',
  'new_name',
  'strict',
];

const toUrlSafeBase64 = function (value) {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const getSubLink = function (urls, api, target, remoteConfig, isShowMoreConfig, moreConfig) {
  const params = new URLSearchParams();
  const [targetName, ...targetArguments] = target.split('&');
  params.set('target', targetName);
  for (const argument of targetArguments) {
    const [name, value = ''] = argument.split('=');
    if (name) {
      params.set(name, value);
    }
  }
  params.set('url', urls.split('\n').join('|'));
  if (remoteConfig) {
    params.set('config', remoteConfig);
  }

  if (isShowMoreConfig) {
    for (const name of TEXT_PARAMETERS) {
      const value = String(moreConfig[name] ?? '').trim();
      if (value) {
        params.set(name, value);
      }
    }
    for (const name of BASE64_PARAMETERS) {
      const value = String(moreConfig[name] ?? '').trim();
      if (value) {
        params.set(name, toUrlSafeBase64(value));
      }
    }
    for (const name of BOOLEAN_PARAMETERS) {
      const value = moreConfig[name];
      if (value === 'true' || value === 'false') {
        params.set(name, value);
      }
    }
  }

  return `${api}/sub?${params.toString()}`;
};

const regexCheck = function (url) {
  const reg_url = /https?:\/\/[-A-Za-z0-9+&@#/%?=~_|!:,.;]+[-A-Za-z0-9+&@#/%=~_|]/;
  if (reg_url.test(url)) {
    return true;
  } else {
    return false;
  }
};

export { regexCheck, getSubLink };
