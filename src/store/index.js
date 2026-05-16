import { reactive } from "sia-reactor";
import {
  PersistModule,
  LocalStorageAdapter,
  TimeTravelModule,
} from "sia-reactor/modules";

// Centralized Reactor Store
// Consolidates all global state from AuthContext, ThemeContext, and DataContext

const initialState = {
  auth: {
    user: null,
    isAuthenticated: false,
  },
  ui: {
    theme: "light",
    hideBalance: false,
    currency: "NGN",
  },
  data: {
    walletEntries: [],
    savingsEntries: [],
    investmentsEntries: [],
  },
};

// Create the reactive state
export const store = reactive(initialState);

// Initialize time travel for debugging
export const timeTravel = new TimeTravelModule({ blacklist: ["data"], maxPlaybackDelay: 1 });

// Initialize persistence after state creation
const persist = new PersistModule({
  key: "save-my-way-store",
  throttle: 150,
  adapter: LocalStorageAdapter,
}).attach(timeTravel.state, "timeTravel");

store.use(persist, "app").use(timeTravel);

// Apply initial theme
document.documentElement.setAttribute("data-theme", store.ui.theme);

// Listen for theme changes
store.on("ui.theme", (e) => {
  document.documentElement.setAttribute("data-theme", e.value);
});
