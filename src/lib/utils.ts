export function hexStringToDecimal(oxHex: string): number {
  if (typeof oxHex !== 'string') {
    throw Error('Wrong hex string signature');
  }
  const hex = oxHex.replace(/^0x/, '');
  try {
    return parseInt(hex, 16);
  } catch (error) {
    return NaN;
  }
}

export function intToHex(integer: number): string {
  return Number(integer).toString(16);
}

type Params = { [key: string]: string | number | boolean };

export function getUrlWithParams(apiBaseUrl: string, params: Params) {
  return (
    apiBaseUrl +
    '?' +
    Object.entries(params)
      .map(([key, val]) => `${key}=${encodeURIComponent(val)}`)
      .join('&')
  );
}
