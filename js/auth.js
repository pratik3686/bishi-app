async function hashPin(pin) {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + 'bishi-app-salt-v1');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function verifyPin(pin, storedHash) {
  if (!storedHash || !pin) return false;
  return (await hashPin(pin)) === storedHash;
}

function isValidPin(pin) {
  return /^\d{4,6}$/.test(pin);
}
