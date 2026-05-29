import { createRoot } from "react-dom/client";
import * as amplitude from "@amplitude/unified";
import App from "./App.tsx";
import "./index.css";
import "./i18n";

amplitude.initAll("3af7afd09b2a4327412064abacd05263", {
  analytics: { autocapture: true },
  sessionReplay: { sampleRate: 1 },
});

createRoot(document.getElementById("root")!).render(<App />);
