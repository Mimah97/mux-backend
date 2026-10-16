/**
 * Key type identifiers for the custody key management module.
 *
 * Only `STELLAR_ED25519` is currently implemented. The remaining
 * members are declared for forward compatibility but are NOT
 * implemented; they are rejected at runtime by `KeyManagementService`.
 */
export enum KeyType {
  STELLAR_ED25519 = 'STELLAR_ED25519',
  ETHEREUM_SECP256K1 = 'ETHEREUM_SECP256K1',
  AWS_KMS = 'AWS_KMS',
  HSM = 'HSM',
}

/**
 * The set of key types that are actually implemented today.
 *
 * This is the machine-readable counterpart to the `(future)` markers
 * above: any `KeyType` not present here must be rejected by callers
 * (fail-closed) rather than silently falling through to a default
 * branch.
 */
export const SUPPORTED_KEY_TYPES: readonly KeyType[] = [
  KeyType.STELLAR_ED25519,
];

/**
 * Type guard for the currently supported key types.
 */
export function isSupportedKeyType(value: unknown): value is KeyType {
  return (
    typeof value === 'string' &&
    (SUPPORTED_KEY_TYPES as readonly string[]).includes(value)
  );
}

export enum KeyOperation {
  GENERATE = 'GENERATE',
  SIGN = 'SIGN',
  VALIDATE = 'VALIDATE',
  ROTATE = 'ROTATE',
  DECRYPT = 'DECRYPT',
}

export interface KeyGenerationResult {
  publicKey: string;
  encryptedKeyMaterial: string;
  keyType: KeyType;
  version: number;
  createdAt: string;
}

export interface SignResult {
  signature: string;
  publicKey: string;
  algorithm: string;
  timestamp: string;
}

export interface ValidateResult {
  valid: boolean;
}

export interface RotateResult {
  walletId: string;
  publicKey: string;
  encryptedKeyMaterial: string;
  keyType: KeyType;
  version: number;
  rotatedAt: string;
}

export interface KeyAuditLogEntry {
  id: string;
  operation: KeyOperation;
  keyType: KeyType;
  publicKey: string;
  timestamp: string;
  success: boolean;
  error?: string;
  requestId: string;
  metadata?: Record<string, unknown>;
}

export interface AuditEntry {
  operation: KeyOperation;
  keyType: KeyType;
  publicKey: string;
  timestamp: string;
  success: boolean;
  error?: string;
  requestId: string;
  metadata?: Record<string, unknown>;
}

export interface AuditLogQueryParams {
  keyType?: KeyType;
  operation?: KeyOperation;
  publicKey?: string;
  success?: boolean;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}
