const crypto = require('crypto');

function getNonce() {
  const nonce = crypto.randomBytes(32)
    .toString('hex');
  const hash = crypto.createHmac('sha256', nonce)
    .digest('hex');
  return [nonce, hash];
}

function validateNonce(nonce, hash) {
  const other = crypto.createHmac('sha256', nonce)
    .digest('hex');
  return (other === hash);
}

module.exports = {
  getNonce, validateNonce,
};
