'use client';

import ApplicationWizard from '../../components/ApplicationWizard';

export default function ApplicationPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sentinel STR</h1>
            <p className="text-sm text-gray-600">STR License Application</p>
          </div>
          <div className="flex gap-4">
            <a href="/" className="text-gray-600 hover:text-gray-900">
              Home
            </a>
            <a href="/login" className="text-gray-600 hover:text-gray-900">
              Sign in
            </a>
          </div>
        </div>
      </header>

      {/* Wizard */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <ApplicationWizard />
      </div>
    </main>
  );
}
