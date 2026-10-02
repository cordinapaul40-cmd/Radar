import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

// AES-256-GCM. RADAR_ENCRYPTION_KEY = 32 octets encodés en base64
// (générer avec : openssl rand -base64 32).
function cle() {
  const brute = Buffer.from(process.env.RADAR_ENCRYPTION_KEY ?? "", "base64");
  if (brute.length !== 32) throw new Error("RADAR_ENCRYPTION_KEY doit faire 32 octets (base64).");
  return brute;
}

export function chiffrer(texte: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", cle(), iv);
  const donnees = Buffer.concat([cipher.update(texte, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), donnees].map((b) => b.toString("base64")).join(".");
}

export function dechiffrer(paquet: string) {
  const [iv, tag, donnees] = paquet.split(".").map((p) => Buffer.from(p, "base64"));
  const decipher = createDecipheriv("aes-256-gcm", cle(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(donnees), decipher.final()]).toString("utf8");
}
