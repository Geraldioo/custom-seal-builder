import { createFileRoute } from "@tanstack/react-router";

const REDIRECT_URL = "https://www.entrupy.com/";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Entrupy" },
      { name: "robots", content: "noindex, nofollow" },
      { httpEquiv: "refresh", content: `0; url=${REDIRECT_URL}` },
    ],
  }),
  component: RedirectPage,
});

function RedirectPage() {
  if (typeof window !== "undefined") {
    window.location.replace(REDIRECT_URL);
  }
  return (
    <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif", color: "#555" }}>
      <p>
        Redirecting to{" "}
        <a href={REDIRECT_URL} style={{ color: "#000", textDecoration: "underline" }}>
          entrupy.com
        </a>
        …
      </p>
    </div>
  );
}
