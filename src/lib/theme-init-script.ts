/**
 * Sets the `dark` class on <html> before hydration, based on a stored
 * preference or the system setting. Without this, the page renders in
 * light mode for a frame and then snaps to dark — a "flash of
 * incorrect theme" that reads as unpolished on exactly the kind of
 * premium surface we're building.
 *
 * Kept as a plain string in its own module (no JSX) so it can be
 * inlined via `next/script` with the `beforeInteractive` strategy
 * directly in the root layout, which is where Next.js expects that
 * strategy to be declared for the App Router.
 */
export const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem("theme");
    var isDark = stored ? stored === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", isDark);
  } catch (e) {}
})();
`;
