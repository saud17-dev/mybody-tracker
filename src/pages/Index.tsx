// Unused fallback route placeholder. Kept token-based so it can never render
// an off-theme light background if something ever routes to it.
const Index = () => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <img src="/placeholder.svg" alt="Your app will live here!" />
  </div>
);

export default Index;
