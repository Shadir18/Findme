export default function LoadingScreen() {
  return (
    <div className="min-h-screen bg-blue-600 flex flex-col items-center justify-center text-white">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-white mb-4"></div>
      <h1 className="text-4xl font-bold animate-pulse tracking-tight">Find Me</h1>
      <p className="mt-2 text-blue-100 font-medium">Matching players in Sri Lanka...</p>
    </div>
  );
}