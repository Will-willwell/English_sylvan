import { useEffect, useState } from "react";
import { Download, WifiOff } from "lucide-react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type WindowWithInstallPrompt = Window & { __lingodeskInstallPrompt?: InstallPromptEvent };

export function PwaInstallButton() {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [offline, setOffline] = useState(() => !navigator.onLine);

  useEffect(() => {
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      const prompt = event as InstallPromptEvent;
      (window as WindowWithInstallPrompt).__lingodeskInstallPrompt = prompt;
      setInstallPrompt(prompt);
    };
    const onInstalled = () => {
      setInstallPrompt(null);
      delete (window as WindowWithInstallPrompt).__lingodeskInstallPrompt;
    };
    const onOnline = () => setOffline(false);
    const onOffline = () => setOffline(true);
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  async function install() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") setInstallPrompt(null);
  }

  if (offline) return <span className="network-status offline" title="Offline mode"><WifiOff size={14} />Offline</span>;
  if (!installPrompt) return null;
  return <button className="install-button" onClick={() => void install()}><Download size={14} />Install app</button>;
}
