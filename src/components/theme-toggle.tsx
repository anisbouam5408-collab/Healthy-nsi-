"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";

const THEME_CHANGE_EVENT = "healthy-nsi:theme-change";

/**
 * The `dark` class on <html> is an external system (the DOM, mutated by
 * the inline theme-init script and by this component itself) — reading
 * it belongs in `useSyncExternalStore`, not in a `useEffect` that calls
 * `setState` on mount. The latter causes an extra render pass for no
 * benefit and is exactly the pattern React 19's stricter hooks lint
 * rule (`react-hooks/set-state-in-effect`) now flags.
 */
function subscribe(callback: () => void) {
  window.addEventListener(THEME_CHANGE_EVENT, callback);
  return () => window.removeEventListener(THEME_CHANGE_EVENT, callback);
}

function getSnapshot() {
  return document.documentElement.classList.contains("dark");
}

// The server has no DOM to read; default to light and let the client
// snapshot take over immediately after hydration (React's built-in
// pattern for this exact situation — no manual "mounted" flag needed).
function getServerSnapshot() {
  return false;
}

export function ThemeToggle() {
  const isDark = React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function toggle() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  }

  return (
    <Button
      variant="secondary"
      size="icon"
      onClick={toggle}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
    >
      {isDark ? <Sun /> : <Moon />}
    </Button>
  );
}
