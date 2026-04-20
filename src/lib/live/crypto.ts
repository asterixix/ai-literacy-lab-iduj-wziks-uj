import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

interface EncryptedSecret {
  encryptedKey: string;
  iv: string;
  authTag: string;
}

function getKeyMaterial(): Buffer {
  const secret = process.env.ENCRYPTION_KEY;
  if (!secret) {
    throw new Error("ENCRYPTION_KEY is missing.");
  }
  return createHash("sha256").update(secret).digest();
}

export function encryptSecret(value: string): EncryptedSecret {
  const key = getKeyMaterial();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);

  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    encryptedKey: encrypted.toString("hex"),
    iv: iv.toString("hex"),
    authTag: authTag.toString("hex"),
  };
}

export function decryptSecret(payload: EncryptedSecret): string {
  const key = getKeyMaterial();
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(payload.iv, "hex"));
  decipher.setAuthTag(Buffer.from(payload.authTag, "hex"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(payload.encryptedKey, "hex")),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}
