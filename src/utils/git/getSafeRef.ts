/* eslint-disable no-useless-escape */

function getSafeRef(ref: string) {
  // Replace fullstops
  // ~, ^ or : ? * [
  // /
  // remove @ sybmobls
  // remove backslash
  const safeRef = ref.replace(/[\.\[\~\^\:\?\*\@\/\\]/gi, "-");
  return safeRef;
}

module.exports = getSafeRef;
