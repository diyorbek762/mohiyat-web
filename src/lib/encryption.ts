import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = process.env.DOCUMENT_ENCRYPTION_KEY; 
const IV_LENGTH = 16; 

export function encryptBuffer(buffer: Buffer): Buffer {
  if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
    throw new Error('DOCUMENT_ENCRYPTION_KEY must be exactly 32 characters long');
  }

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
  
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  
  // Prepend IV to the encrypted buffer so we can extract it for decryption
  return Buffer.concat([iv, encrypted]);
}

export function decryptBuffer(buffer: Buffer): Buffer {
  if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
    throw new Error('DOCUMENT_ENCRYPTION_KEY must be exactly 32 characters long');
  }

  // Extract the IV from the first 16 bytes
  const iv = buffer.subarray(0, IV_LENGTH);
  const encryptedText = buffer.subarray(IV_LENGTH);
  
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
  
  return Buffer.concat([decipher.update(encryptedText), decipher.final()]);
}
