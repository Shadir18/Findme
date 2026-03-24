export default function MatchGrid({ matches }) {
  return (
    <div className="max-w-5xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Generated Matches</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(matches).map(([sport, players]) => (
          <div key={sport} className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
            <div className="bg-blue-600 text-white py-3 px-4 font-bold text-lg flex justify-between">
              {sport} <span>{players.length}</span>
            </div>
            <div className="p-4 min-h-[150px]">
              {players.length === 0 ? (
                <p className="text-gray-400 italic text-center mt-4">No players yet...</p>
              ) : (
                <ul className="space-y-3">
                  {players.map((p, i) => (
                    <li key={i} className="flex items-center text-gray-700 font-medium bg-gray-50 p-2 rounded border-l-4 border-green-500">
                      {p}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}