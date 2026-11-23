import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { authClient } from "@/lib/auth/client";
import bodyHtml from "../explorer/body.html?raw";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  useEffect(() => {
    const refresh = () => {
      void authClient.getSession();
    };
    window.addEventListener("se-auth", refresh);
    if (document.getElementById("explorer-script") || document.getElementById("explorer-engine")) return () => window.removeEventListener("se-auth", refresh);
    // The search engine must be ready before the app starts, so load it first and start the app when it is done
    // (the app still works, with the basic search, if the engine file cannot be loaded).
    const startApp = () => {
      const script = document.createElement("script");
      script.id = "explorer-script";
      script.src = "/explorer/app.js?v=21";
      script.defer = true;
      document.body.appendChild(script);
    };
    const engine = document.createElement("script");
    engine.id = "explorer-engine"; // set immediately so a second effect run (React StrictMode) cannot start the app twice
    engine.src = "/explorer/search-engine.js?v=21";
    engine.onload = startApp;
    engine.onerror = startApp;
    document.body.appendChild(engine);
    return () => window.removeEventListener("se-auth", refresh);
  }, []);

  return (
    <div id="explorer-mount">
      <div dangerouslySetInnerHTML={{ __html: bodyHtml }} />
    </div>
  );
}
