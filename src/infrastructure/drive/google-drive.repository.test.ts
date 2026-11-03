import { describe, it, expect, vi, beforeEach } from "vitest";
import { GoogleDriveRepository } from "./google-drive.repository";

describe("GoogleDriveRepository - OAuth and Token Lifecycle", () => {
  let repo: GoogleDriveRepository;
  let mockRequestAccessToken: any;
  let mockInitTokenClient: any;

  beforeEach(() => {
    mockRequestAccessToken = vi.fn();
    mockInitTokenClient = vi.fn().mockImplementation((config: any) => {
      return {
        requestAccessToken: (override: any) => {
          mockRequestAccessToken(override);
          config.callback({
            access_token: "mock-new-token-12345",
            expires_in: 3600,
          });
        },
      };
    });

    // Mock global window.google
    (global as any).window = {
      location: { hostname: "localhost" },
      google: {
        accounts: {
          oauth2: {
            initTokenClient: mockInitTokenClient,
            revoke: vi.fn((_token, cb) => cb && cb()),
          },
        },
      },
    };

    // Mock localStorage
    const store: Record<string, string> = {};
    (global as any).localStorage = {
      getItem: (k: string) => store[k] || null,
      setItem: (k: string, v: string) => {
        store[k] = v;
      },
      removeItem: (k: string) => {
        delete store[k];
      },
      clear: () => {
        Object.keys(store).forEach((k) => delete store[k]);
      },
    };

    repo = new GoogleDriveRepository();
    // Mark script as already loaded so it doesn't try to appendChild to DOM
    (repo as any).gisScriptLoaded = true;
  });

  it("calls requestAccessToken with prompt 'consent' by default", async () => {
    const token = await repo.login();
    expect(token).toBe("mock-new-token-12345");
    expect(mockRequestAccessToken).toHaveBeenCalledWith({ prompt: "consent" });
    expect(localStorage.getItem("gd-token-expires-at")).toBeDefined();
  });

  it("calls requestAccessToken with prompt '' for silent refresh", async () => {
    const token = await repo.login("");
    expect(token).toBe("mock-new-token-12345");
    expect(mockRequestAccessToken).toHaveBeenCalledWith({ prompt: "" });
  });

  it("accurately detects when a token is expired or about to expire", () => {
    repo.setAccessToken("active-token");

    // Case 1: expires in 10 minutes (not expired)
    localStorage.setItem("gd-token-expires-at", String(Date.now() + 600 * 1000));
    expect(repo.isTokenExpired()).toBe(false);

    // Case 2: expires in 60 seconds (within 2-minute safety margin -> treated as expired)
    localStorage.setItem("gd-token-expires-at", String(Date.now() + 60 * 1000));
    expect(repo.isTokenExpired()).toBe(true);

    // Case 3: already expired 5 minutes ago
    localStorage.setItem("gd-token-expires-at", String(Date.now() - 300 * 1000));
    expect(repo.isTokenExpired()).toBe(true);
  });

  it("clears token and expiresAt on logout", () => {
    repo.setAccessToken("token-to-revoke");
    localStorage.setItem("gd-token-expires-at", String(Date.now() + 10000));

    repo.logout();

    expect(localStorage.getItem("gd-token-expires-at")).toBeNull();
    expect(repo.isTokenExpired()).toBe(true);
  });
});
