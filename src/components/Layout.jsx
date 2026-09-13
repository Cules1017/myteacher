import NavBar from "./NavBar";

function Layout({ children }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-bg-base text-text-base">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="animate-blob absolute -left-24 -top-24 h-96 w-96 rounded-full bg-indigo-600/30 blur-3xl" />
        <div className="animate-blob animation-delay-4000 absolute right-0 top-1/3 h-96 w-96 rounded-full bg-primary-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-fuchsia-600/20 blur-3xl" />
      </div>

      <NavBar />

      <div className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 pb-28 pt-10 sm:px-10 sm:pb-16 sm:pt-32">
        {children}
      </div>
    </div>
  );
}

export default Layout;
