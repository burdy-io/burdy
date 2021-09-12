/**
 * Format bytes as human-readable text.
 *
 * @param bytes Number of bytes.
 * @param si True to use metric (SI) units, aka powers of 1000. False to use
 *           binary (IEC), aka powers of 1024.
 * @param dp Number of decimal places to display.
 *
 * @return Formatted string.
 */
export const humanFileSize = (bytes: number, dp = 1) => {
  const thresh = 1024;

  if (Math.abs(bytes) < thresh) {
    return `${bytes} B`;
  }

  const units = ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  let u = -1;
  const r = 10 ** dp;

  do {
    bytes /= thresh;
    ++u;
  } while (
    Math.round(Math.abs(bytes) * r) / r >= thresh &&
    u < units.length - 1
  );

  return `${bytes.toFixed(dp)} ${units[u]}`;
};

export const copyToClipboard = (str) => {
  const el = document.createElement('textarea');
  el.value = str;
  el.setAttribute('readonly', '');
  el.style.display = 'hidden';
  document.body.appendChild(el);
  const selected =
    document.getSelection().rangeCount > 0
      ? document.getSelection().getRangeAt(0)
      : false;
  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);
  if (selected) {
    document.getSelection().removeAllRanges();
    document.getSelection().addRange(selected);
  }
};

export const getMeta = (obj: any, key: string) => {
  return (obj?.meta ?? []).find((meta) => meta?.key === key);
};

export const getMetaValue = (obj: any, key: string) => {
  return getMeta(obj, key)?.value;
};


/**
 * The function returns true if the string passed to it has no content.
 */
export const isEmptyString = (str) => {
  if (str === undefined || str === null || str.length === 0 || str.trim().length === 0) {
    return true;
  }
  return false;
}

export const isTrue = (str: string|boolean) => {
  return str == 'true';
}
