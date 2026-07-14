import crypto from "crypto";

// Secret encryption key. In production, this must be a 32-byte key set in environment variables
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "d37d808e08d6d9c661ef4a896d8b671a5c6e8f8101db6f52e5c8e23fde1a5c4e"; // 32 bytes hex
const IV_LENGTH = 12; // For AES-256-GCM

export function encrypt(text) {
  if (!text) return null;
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = Buffer.from(ENCRYPTION_KEY, "hex");
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  
  const authTag = cipher.getAuthTag().toString("hex");
  
  // Format: iv:encryptedText:authTag
  return `${iv.toString("hex")}:${encrypted}:${authTag}`;
}

export function decrypt(encryptedText) {
  if (!encryptedText) return null;
  const parts = encryptedText.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encryption format");
  }
  
  const iv = Buffer.from(parts[0], "hex");
  const encrypted = Buffer.from(parts[1], "hex");
  const authTag = Buffer.from(parts[2], "hex");
  
  const key = Buffer.from(ENCRYPTION_KEY, "hex");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  
  return decrypted;
}
