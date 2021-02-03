import { createCipheriv, randomBytes, createDecipheriv, createHmac, Hmac, createHash } from "crypto";

export interface IEncryptFunc {
  (value:string):string;
}

export interface IDecryptFunc {
  (encrypted:string):string;
}

export interface HashPasswordFunc {
  (password:string):Promise<string>;
}

export interface VerifyPasswordFunc {
  (password:string, hash:string):Promise<boolean>;
}

export const makeEncryptFunction = (secret:string, algo:string = 'aes-256-cbc', ivSize:number = 32):IEncryptFunc => (value:string):string => {
  const iv = randomBytes(ivSize);
  const cipher = createCipheriv(algo, secret, iv);
  let encrypted = cipher.update(value, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted + '.' + iv;
};

export const makeDecryptFunction = (secret:string, algo:string = 'aes-256-cbc'):IDecryptFunc => (value:string):string => {
  const [encrypted, iv] = value.split('.');
  const decipher = createDecipheriv(algo, secret, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

export const createS256Hash = (value:string):Buffer => createHash('sha256').update(value).digest();

export const makeHmac = (secret:string, algorithm:string = 'sha256') => (...values:string[]):Buffer => values.reduce((hmac:Hmac, value:string) => hmac.update(value), createHmac(algorithm, secret)).digest();

export const makeRandomBytes = async (length:number):Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    randomBytes(length, (err, buff) => {
      if (err) {
        reject(err);
      } else {
        resolve(buff);
      }
    });
  });
};

export enum CHARSETS {
  UNRESERVED_URI = 'abcdefghijklmnopqrstuwxyzABCDEFGHIJKLMNOPQRSTUWXYZ0123456789_-~.',
  PASSWORD = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-#~@<>,./?;:\'!"£$%^&*()+=|\\`',
  FILE_SAFE = 'abcdefghijklmnopqrstuwxyzABCDEFGHIJKLMNOPQRSTUWXYZ0123456789_-',
  ALPHANUMERIC = 'abcdefghijklmnopqrstuwxyzABCDEFGHIJKLMNOPQRSTUWXYZ0123456789',
  ALPHA_CAPS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
}

export const randomText = (length:number, charset:string) => {
  const rnd = randomBytes(length);
  const value = new Array(length);
  const len = Math.min(256, charset.length);
  const d = 256 / len;
  for (let i = 0; i < length; i++) {
    value[i] = charset[Math.floor(rnd[i] / d)];
  }
  return value.join('');
};

export function constantTimeEq(a:Buffer, b:Buffer):boolean {

  // shortcutting on type is necessary for correctness
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    return false;
  }

  // buffer sizes should be well-known information, so despite this
  // shortcutting, it doesn't leak any information about the *contents* of the
  // buffers.
  if (a.length !== b.length) {
    return false;
  }

  let c = 0;

  for (let i = 0; i < a.length; i++) {
    /*jshint bitwise:false */
    c |= a[i] ^ b[i]; // XOR
  }

  return c === 0;

}
