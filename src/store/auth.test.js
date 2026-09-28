import test from "node:test";
import assert from "node:assert/strict";

const makeLocalStorage = () => {
  const store = new Map();
  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(String(key), String(value));
    },
    removeItem(key) {
      store.delete(String(key));
    },
    clear() {
      store.clear();
    },
  };
};

const originalLocalStorage = globalThis.localStorage;
const originalCrypto = globalThis.crypto;

const setTestEnvironment = () => {
  Object.defineProperty(globalThis, "localStorage", {
    value: makeLocalStorage(),
    configurable: true,
    writable: true,
  });

  Object.defineProperty(globalThis, "crypto", {
    value: {
      randomUUID: () => `test-uuid-${Math.random().toString(16).slice(2)}`,
      subtle: {
        digest: async (_algorithm, data) => {
          const text = typeof data === "string" ? data : new TextDecoder().decode(data);
          const bytes = new TextEncoder().encode(text);
          const hash = new Uint8Array(32);
          for (let i = 0; i < bytes.length; i += 1) {
            hash[i % 32] ^= bytes[i] + 0x9e3779b9 + (i * 33);
          }
          return hash.buffer;
        },
      },
    },
    configurable: true,
    writable: true,
  });
};

test.afterEach(() => {
  if (originalLocalStorage) {
    Object.defineProperty(globalThis, "localStorage", {
      value: originalLocalStorage,
      configurable: true,
      writable: true,
    });
  } else {
    delete globalThis.localStorage;
  }

  if (originalCrypto) {
    Object.defineProperty(globalThis, "crypto", {
      value: originalCrypto,
      configurable: true,
      writable: true,
    });
  } else {
    delete globalThis.crypto;
  }
});

test("signUp rejects duplicate emails and stores a persistent account", async () => {
  setTestEnvironment();
  const { signUp, signIn, signOut, getRegisteredUsers } = await import("./actions.js");

  const first = await signUp({
    name: "User A",
    phone: "+123",
    email: "userA@example.com",
    password: "secret123",
  });

  assert.equal(first.ok, true);
  assert.equal(first.user.email, "usera@example.com");

  const duplicate = await signUp({
    name: "User A Again",
    phone: "+124",
    email: "userA@example.com",
    password: "anotherpass",
  });

  assert.equal(duplicate.ok, false);
  assert.equal(duplicate.error, "An account with this email already exists.");

  const users = getRegisteredUsers();
  assert.equal(users.length, 1);
  assert.equal(users[0].email, "usera@example.com");

  const signedIn = await signIn("userA@example.com", "secret123");
  assert.equal(signedIn.ok, true);

  signOut();
});

test("different accounts keep isolated data and sessions", async () => {
  setTestEnvironment();
  const { signUp, signIn, signOut, getSessionStorage, currentAuth } = await import("./actions.js");

  const userA = await signUp({
    name: "Account A",
    phone: "+111",
    email: "a@example.com",
    password: "abc123",
  });
  const userB = await signUp({
    name: "Account B",
    phone: "+222",
    email: "b@example.com",
    password: "def456",
  });

  assert.notEqual(userA.user.id, userB.user.id);

  signOut();

  const sessionA = await signIn("a@example.com", "abc123");
  assert.equal(sessionA.ok, true);
  assert.equal(currentAuth().user.email, "a@example.com");

  signOut();

  const sessionB = await signIn("b@example.com", "def456");
  assert.equal(sessionB.ok, true);
  assert.equal(currentAuth().user.email, "b@example.com");
  assert.equal(getSessionStorage().length >= 1, true);
});
