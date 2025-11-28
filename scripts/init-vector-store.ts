// scripts/init-vector-store.ts

import { initializeVectorStore } from '../lib/vector-store';

async function main() {
  console.log('Initializing vector store...');
  
  try {
    await initializeVectorStore();
    console.log('✓ Vector store initialized successfully');
  } catch (error) {
    console.error('✗ Failed to initialize vector store:', error);
    process.exit(1);
  }
}

main();
