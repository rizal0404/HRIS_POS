import React, { useState } from 'react';
import { apiService } from '../services/apiService';

interface SeederPageProps {
  onSeedSuccess: () => void;
}

const SeederPage: React.FC<SeederPageProps> = ({ onSeedSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [errorDetailsVisible, setErrorDetailsVisible] = useState(false);

  const handleSeed = async () => {
    setIsLoading(true);
    setMessage('');
    setErrorDetailsVisible(false);
    try {
      const result = await apiService.seedDatabase();
      setMessage(result + " The application will now reload.");
      setTimeout(() => {
        onSeedSuccess();
      }, 3000); // Wait 3 seconds before reloading to let user read message
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      if (errorMessage.toLowerCase().includes('permission')) {
          setMessage(`Seeding failed due to a permissions error. Please follow the instructions below.`);
          setErrorDetailsVisible(true);
      } else {
        setMessage(`Seeding failed: ${errorMessage}. Please check the console and try again.`);
      }
      setIsLoading(false);
    }
  };

  const temporaryRules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-2xl p-8 space-y-6 bg-white rounded-lg shadow-lg text-center">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900">
            One-Time Application Setup
          </h2>
          <p className="mt-4 text-slate-600">
            Welcome! It looks like this is the first time you're running the application.
            Your database is currently empty.
          </p>
          <p className="mt-2 text-slate-600">
            Click the button below to initialize all the necessary data, including user profiles, employee lists, and work schedules.
          </p>
        </div>
        
        <div className="mt-8">
          <button
            onClick={handleSeed}
            disabled={isLoading}
            className="w-full flex justify-center py-3 px-4 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 transition-colors"
          >
            {isLoading ? 'Initializing...' : 'Initialize & Seed Database'}
          </button>
        </div>
        
        {message && (
          <p className={`mt-4 text-sm font-medium ${errorDetailsVisible ? 'text-red-600' : 'text-green-600'}`}>
            {message}
          </p>
        )}
        
        {errorDetailsVisible && (
            <div className="mt-6 text-left p-4 bg-orange-50 border-l-4 border-orange-400 text-orange-700">
                <h3 className="font-bold text-lg">How to Fix 'Permission Denied' Error</h3>
                <p className="mt-2 text-sm">This error is expected on a new Firebase project because its security rules are locked by default. To perform this one-time setup, please follow these steps:</p>
                <ol className="list-decimal list-inside space-y-2 mt-3 text-sm">
                    <li>Go to your project in the <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="font-semibold underline hover:text-orange-900">Firebase Console</a>.</li>
                    <li>In the left menu, click on **Firestore Database** (under the "Build" section).</li>
                    <li>Select the **Rules** tab at the top of the page.</li>
                    <li>Delete the existing rules and paste the following temporary rules:</li>
                </ol>
                <pre className="bg-slate-800 text-white p-3 rounded-md mt-2 text-xs overflow-x-auto">
                    <code>{temporaryRules}</code>
                </pre>
                <ol className="list-decimal list-inside space-y-2 mt-3 text-sm" start={5}>
                    <li>Click the **Publish** button.</li>
                    <li>Return to this page and click the **"Initialize & Seed Database"** button again.</li>
                    <li className="font-bold text-red-600">IMPORTANT: After seeding is successful, you MUST restore your original, secure rules in the Firebase Console to protect your database!</li>
                </ol>
            </div>
        )}

      </div>
    </div>
  );
};

export default SeederPage;
