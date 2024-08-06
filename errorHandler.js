// errorHandler.js

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Optionally, exit the process with a non-zero code
    process.exit(1);
  });
  