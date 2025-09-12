import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

import { BrowserRouter } from "react-router-dom";
import ClerkProviderWithNavigate from "./lib/ClerkProviderWithNavigate";
import ClerkSync from "./lib/ClerkSync";

createRoot(document.getElementById("root")).render(
	<StrictMode>
		<BrowserRouter>
			<ClerkProviderWithNavigate>
				<ClerkSync />
				<App />
			</ClerkProviderWithNavigate>
		</BrowserRouter>
	</StrictMode>
);
