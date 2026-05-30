# Certificate migration note

- API base route changed from `/api/v1/keys` to `/api/v1/certificates`.
- Profile response now exposes `serialNumber` instead of `publicKeyFingerprint`.
- User identity serial has been standardized to `serial_number`.
- Backend entry points were introduced under certificate naming via `certificateController` and `certificateRouter`.
- Legacy `RSAPublicKey` storage and the old `key*` files have been removed in favor of the new certificate flow.
- Frontend now exposes certificate management and certificate detail routes instead of key management.
