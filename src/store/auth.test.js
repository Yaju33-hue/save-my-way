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

test("concurrent sign-ups for one email create only one account", async () => {
  setTestEnvironment();
  const { signUp, getRegisteredUsers } = await import("./actions.js");
  const account = {
    name: "Concurrent User",
    phone: "+123",
    email: "same@example.com",
    password: "secret123",
  };

  const results = await Promise.all([signUp(account), signUp(account)]);

  assert.equal(results.filter((result) => result.ok).length, 1);
  assert.equal(getRegisteredUsers().length, 1);
});

test("sign-up fails closed when Web Crypto is unavailable", async () => {
  setTestEnvironment();
  Object.defineProperty(globalThis, "crypto", {
    value: { randomUUID: () => "test-id" },
    configurable: true,
    writable: true,
  });
  const { signUp, getRegisteredUsers } = await import("./actions.js");

  const result = await signUp({
    name: "No Crypto User",
    phone: "+123",
    email: "no-crypto@example.com",
    password: "secret123",
  });

  assert.equal(result.ok, false);
  assert.match(result.error, /Secure password handling is unavailable/);
  assert.equal(getRegisteredUsers().length, 0);
});

test("legacy accounts sign in and migrate away from plaintext passwords", async () => {
  setTestEnvironment();
  const legacyUser = {
    id: "legacy-user-id",
    name: "Legacy User",
    phone: "+123",
    email: "subomiodekunle732@gmail.com",
    password: "The beast12345",
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem("save_my_way_registered_users", JSON.stringify([legacyUser]));

  const { signIn, getRegisteredUsers, signOut } = await import("./actions.js");
  const wrongPassword = await signIn("subomiodekunle732@gmail.com", "wrong-password");
  assert.equal(wrongPassword.ok, false);

  const result = await signIn("SubomiOdekunle732@gmail.com", "The beast12345");
  assert.equal(result.ok, true);

  const [migratedUser] = getRegisteredUsers();
  assert.equal(migratedUser.id, legacyUser.id);
  assert.equal(migratedUser.password, undefined);
  assert.equal(typeof migratedUser.passwordHash, "string");

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

test("initializeAuth restores the active session and its local data", async () => {
  setTestEnvironment();
  const { signUp, initializeAuth, addWalletEntry, signOut, currentAuth } = await import("./actions.js");
  const { store } = await import("./index.js");
  const result = await signUp({
    name: "Session User",
    phone: "+123",
    email: "session@example.com",
    password: "secret123",
  });
  addWalletEntry({ name: "Saved entry", amount: 42, type: "incoming" });
  const savedToken = localStorage.getItem("save_my_way_active_session");

  store.auth.user = null;
  store.auth.session = null;
  store.auth.isAuthenticated = false;
  store.auth.authenticated = false;
  store.auth.loading = true;
  store.data.walletEntries = [];

  const restored = await initializeAuth();

  assert.equal(restored.ok, true);
  assert.equal(currentAuth().user.id, result.user.id);
  assert.equal(currentAuth().session.token, savedToken);
  assert.equal(store.data.walletEntries[0].name, "Saved entry");
  signOut();
});

test("expired sessions are removed and do not authenticate", async () => {
  setTestEnvironment();
  const { signUp, initializeAuth, getSessionStorage, currentAuth } = await import("./actions.js");
  await signUp({
    name: "Expired User",
    phone: "+123",
    email: "expired@example.com",
    password: "secret123",
  });

  const sessions = JSON.parse(localStorage.getItem("save_my_way_sessions"));
  sessions[0].expiresAt = new Date(Date.now() - 1000).toISOString();
  localStorage.setItem("save_my_way_sessions", JSON.stringify(sessions));

  const result = await initializeAuth();

  assert.equal(result.ok, false);
  assert.equal(currentAuth().isAuthenticated, false);
  assert.equal(localStorage.getItem("save_my_way_active_session"), null);
  assert.equal(getSessionStorage().length, 0);
});

test("initializing without an active session clears in-memory private data", async () => {
  setTestEnvironment();
  const { signUp, initializeAuth, addWalletEntry } = await import("./actions.js");
  const { store } = await import("./index.js");
  await signUp({
    name: "Previous User",
    phone: "+123",
    email: "previous@example.com",
    password: "secret123",
  });
  addWalletEntry({ name: "Private entry", amount: 18, type: "incoming" });
  localStorage.removeItem("save_my_way_active_session");

  const result = await initializeAuth();

  assert.equal(result.ok, false);
  assert.equal(store.data.walletEntries.length, 0);
  assert.equal(store.data.savingsEntries.length, 0);
  assert.equal(store.data.investmentsEntries.length, 0);
});

test("signing out and into another account loads only that account's data", async () => {
  setTestEnvironment();
  const { signUp, signIn, signOut, addWalletEntry, updateProfileImage } = await import("./actions.js");
  const { store } = await import("./index.js");

  const userA = await signUp({
    name: "Account A",
    phone: "+111",
    email: "isolated-a@example.com",
    password: "abc123",
  });
  addWalletEntry({ name: "A private entry", amount: 1, type: "incoming" });
  assert.equal(
    updateProfileImage("data:image/jpeg;base64,dXNlckEtYXZhdGFy=", { x: 68, y: 42 }),
    true,
  );
  signOut();

  await signUp({
    name: "Account B",
    phone: "+222",
    email: "isolated-b@example.com",
    password: "def456",
  });

  assert.equal(store.data.walletEntries.length, 0);
  assert.equal(store.auth.user.profileImage, "");
  const savedData = JSON.parse(localStorage.getItem("save_my_way_user_data"));
  assert.equal(savedData[userA.user.id].walletEntries[0].name, "A private entry");
  assert.match(savedData[userA.user.id].profileImage, /^data:image\/jpeg;base64,/);
  assert.deepEqual(savedData[userA.user.id].profileImagePosition, { x: 68, y: 42 });
  signOut();

  await signIn("isolated-a@example.com", "abc123");
  assert.match(store.auth.user.profileImage, /^data:image\/jpeg;base64,/);
  assert.deepEqual(store.auth.user.profileImagePosition, { x: 68, y: 42 });
  signOut();
});

test("legacy settings-based avatars migrate into the account profile", async () => {
  setTestEnvironment();
  const { initializeAuth, updateProfileImage, signOut } = await import("./actions.js");
  const { store } = await import("./index.js");
  const userId = "legacy-avatar-user";
  const token = "legacy-avatar-session";
  const legacyImage = "data:image/jpeg;base64,bGVnYWN5LWF2YXRhcg==";
  const legacyPosition = { x: 62, y: 38 };
  const now = new Date().toISOString();
  localStorage.setItem("save_my_way_registered_users", JSON.stringify([{
    id: userId,
    name: "Legacy Avatar",
    email: "legacy-avatar@example.com",
    createdAt: now,
  }]));
  localStorage.setItem("save_my_way_sessions", JSON.stringify([{
    id: "legacy-avatar-session-id",
    token,
    userId,
    createdAt: now,
    expiresAt: new Date(Date.now() + 3600000).toISOString(),
  }]));
  localStorage.setItem("save_my_way_active_session", token);
  localStorage.setItem("save_my_way_user_data", JSON.stringify({
    [userId]: {
      id: userId,
      walletEntries: [],
      savingsEntries: [],
      investmentsEntries: [],
      settings: {
        theme: "light",
        hideBalance: false,
        currency: "NGN",
        profileImage: legacyImage,
        profileImagePosition: legacyPosition,
      },
    },
  }));

  const restored = await initializeAuth();

  assert.equal(restored.ok, true);
  assert.equal(store.auth.user.profileImage, legacyImage);
  assert.deepEqual(store.auth.user.profileImagePosition, legacyPosition);
  assert.equal(updateProfileImage(legacyImage, legacyPosition), true);
  const savedData = JSON.parse(localStorage.getItem("save_my_way_user_data"));
  assert.equal(savedData[userId].profileImage, legacyImage);
  assert.deepEqual(savedData[userId].profileImagePosition, legacyPosition);
  assert.equal(savedData[userId].settings.profileImage, undefined);
  signOut();
});
