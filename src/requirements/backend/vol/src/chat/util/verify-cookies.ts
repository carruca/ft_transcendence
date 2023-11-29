import { MissingEnvironmentVariableError, InvalidCookieSignatureError } from '../error';

import * as cookieParser from 'cookie-parser';

export function verifyCookies(data: string): {[key: string]: string} {
  if (!data) {
    return {};
  }
  const items = data.split('; ');
  let table: {[key: string]: string} = {};

  if (typeof process.env.NEST_COOKIE_SECRET === 'undefined')
    throw new MissingEnvironmentVariableError('Missing environment variable: NEST_COOKIE_SECRET')

  for (const item of items) {
    const [key, value] = item.split('=');
    const signedValue = cookieParser.signedCookie(decodeURIComponent(value), process.env.NEST_COOKIE_SECRET);

    if (signedValue === false)
      throw new InvalidCookieSignatureError('Invalid cookie signature');
    table[key] = signedValue;
  }
  return table;
}
