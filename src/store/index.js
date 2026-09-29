import { reactive } from "sia-reactor";
import { TimeTravelModule } from "sia-reactor/modules";

const defaultUiState = {
  theme: "light",
  hideBalance: false,
  currency: "NGN",
};

const initialState = {
  auth: {
    user: null,
    session: null,
    isAuthenticated: false,
    authenticated: false,
    loading: true,
    status: "loading",
    error: null,
  },
  ui: { ...defaultUiState },
  data: {
    walletEntries: [],
    savingsEntries: [],
    investmentsEntries: [],
  },
};

export const store = reactive(initialState);

export const timeTravel = new TimeTravelModule({ blacklist: ["data"], maxPlaybackDelay: 1 });
store.use(timeTravel);

if (typeof document !== "undefined") {
  document.documentElement.setAttribute("data-theme", store.ui.theme);
}

store.on("ui.theme", (e) => {
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-theme", e.value);
  }
});

export const defaultUiStateSnapshot = () => ({ ...defaultUiState });
