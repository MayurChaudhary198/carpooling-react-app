import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import { Toaster } from "react-hot-toast";
import { store } from "@/store";
import { ThemeProvider } from "@carpooling/common";
import "./index.css";
import App from "./App.tsx";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  // <StrictMode>
  <Provider store={store}>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider storageKey="rideshare-theme">
        <BrowserRouter>
          <App />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                borderRadius: "12px",
                fontSize: "13px",
                fontWeight: "500",
              },
            }}
          />
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  </Provider>
  // </StrictMode>
);
