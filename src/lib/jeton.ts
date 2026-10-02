import { createHash, randomBytes } from "node:crypto";

export const nouveauJeton = () => randomBytes(24).toString("base64url");
export const empreinte = (jeton: string) => createHash("sha256").update(jeton).digest("hex");
