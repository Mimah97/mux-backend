# Auth & Feature Flags

This document describes the authorization model and feature-flag / kill-switch
surface used by the invisible-wallet orchestration path. It is the companion to
[`docs/WALLET-API.md`](./WALLET-API.md) and is intended for Stellar Wave
contributors working on wallet orchestration.

## Invariants

1. The server is the source of truth for spends, recovery, and admin actions.
   Clients cannot bypass policy by calling the wallet API directly.
2. Every privileged entrypoint is **deny-by-default**: if the caller's role,
   delegate status, or feature flag cannot be positively verified, the request
   is rejected.
3. Money-path and mainnet-affecting behavior is gated behind a feature flag or
   kill-switch. When the flag is off, the endpoint fails closed with a stable
error code rather than silently degrading.
4. All external entrypoints are rate-limited and authorized. Correlation ids
   are propagated on every request and echoed in error envelopes.

## Roles

| Role      | Source                          | Can orchestrate wallets | Can spend | Can recover |
|-----------|---------------------------------|-------------------------|-----------|-------------|
| owner     | wallet record                   | yes                     | yes       | yes         |
| delegate  | signed delegation, not revoked  | yes                     | per grant | no          |
| guardian  | recovery config                 | no                      | no        | yes         |
| api-key   | server-issued, scoped           | per scope               | per scope | no          |
| jwt       | session token, unexpired        | per scope               | per scope | no          |

A revoked delegate, an expired JWT, or a wrong role must be rejected before any
wallet state is mutated.

## Feature flags

Flags are read from the environment and default to **off** in production unless
explicitly enabled. The wallet orchestration path uses:

- `WALLET_ORCHESTRATION_ENABLED` — master switch for the orchestration
  entrypoints. When unset or `false`, orchestration requests fail closed with
  `WALLET_ORCHESTRATION_DISABLED`.
- `WALLET_ORCHESTRATION_MAINNET_ENABLED` — additional gate for mainnet. Testnet
  may be enabled independently; mainnet requires both flags.

### Kill-switch

Setting `WALLET_ORCHESTRATION_ENABLED=false` disables the orchestration path
without a deploy. In-flight requests complete; new requests are rejected with
the stable error code above. This is the documented rollback for the
orchestration change.

## Stable error codes

| Code                              | Meaning                                              |
|-----------------------------------|------------------------------------------------------|
| `WALLET_ORCHESTRATION_DISABLED`   | Feature flag off; fail closed.                       |
| `WALLET_AUTHZ_DENIED`             | Caller lacks owner/delegate/guardian/scope rights.   |
| `WALLET_DELEGATE_REVOKED`         | Delegate grant revoked or expired.                   |
| `WALLET_IDEMPOTENCY_CONFLICT`     | Replayed request with a different payload.           |
| `WALLET_DEPENDENCY_UNAVAILABLE`   | RPC/DB/Horizon outage; writes fail closed.           |

Errors are returned in the shared error envelope and include the request
correlation id. Secrets, JWTs, webhook secrets, and raw key material are never
logged or returned.

## Idempotency

Concurrent or replayed orchestration requests must carry an idempotency key.
The server stores the key with the resulting response; a replay with the same
payload returns the stored response, and a replay with a different payload is
rejected with `WALLET_IDEMPOTENCY_CONFLICT`.

## Testnet vs mainnet

Misconfiguration is treated as a failure mode: if the environment is mainnet
and `WALLET_ORCHESTRATION_MAINNET_ENABLED` is not set, orchestration fails
closed. Testnet defaults are documented in [`docs/WALLET-API.md`](./WALLET-API.md).

## References

- [`docs/WALLET-API.md`](./WALLET-API.md)
- `test/wallet-orchestration.e2e-spec.ts`
