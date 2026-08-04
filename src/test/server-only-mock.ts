// Intentionally empty.
//
// The real `server-only` package throws unless imported under Next's
// "react-server" bundler condition, which doesn't exist when Vitest
// runs a file directly in Node — so integration tests that import
// server-only modules (the db client, tenant-context) need this
// stubbed out. This does not weaken the production guard: Next's own
// build still resolves `server-only` normally and still fails a build
// that imports a server-only module from client code. This alias only
// applies inside the test runner (see vitest.config.mts).
