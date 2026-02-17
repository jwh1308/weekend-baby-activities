import '@testing-library/jest-dom/vitest';

process.env.NEXT_PUBLIC_FIREBASE_API_KEY ??= 'test-api-key';
process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ??= 'test.firebaseapp.com';
process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ??= 'test-project';
process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ??= 'test.appspot.com';
process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ??= '1234567890';
process.env.NEXT_PUBLIC_FIREBASE_APP_ID ??= '1:1234567890:web:test';
