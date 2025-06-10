export default function Test() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          🎉 Frontend is Working!
        </h1>
        <p className="text-gray-600 mb-4">
          The Next.js application is running successfully.
        </p>
        <div className="space-y-2">
          <p>✅ React components loading</p>
          <p>✅ Tailwind CSS working</p>
          <p>✅ Next.js routing functional</p>
        </div>
        <div className="mt-6">
          <a 
            href="/" 
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Go to Home
          </a>
        </div>
      </div>
    </div>
  );
}
