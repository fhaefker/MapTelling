# RFC 04: Protocol Template Utilities

## 1. Problem
Custom data protocols require referencing internal examples; no guided DX pattern.

## 2. APIs
```ts
createTextProtocolHandler({ maxBytes?, allowPattern?, transform? }) => handler
useRegisterProtocol({ scheme, handler }) => void
```

## 3. Behavior
- Size guard aborts large payload fetch.
- Optional allowlist regex.
- Transform hook for CSV/TSV/other conversions.

## 4. Security
Encourages explicit allowPattern & maxBytes (aligns with capabilities sec59).

## 5. Migration
Optional addition; protocols registered inside React tree.

## 6. Alternatives
Manual `useAddProtocol` usage with duplicated parsing.

## 7. Tests
- Protocol stored in internal registry after mount.

## 8. References
Capabilities: sections 52 (protocol handlers), 59 (security hardening).
