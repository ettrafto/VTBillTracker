const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the React app's build directory
const buildPath = path.join(__dirname, 'src', 'build');
app.use(express.static(buildPath));

// Handle API routes or other server-side logic if needed
// Example: app.use('/api', apiRouter);

// Serve the main index.html file for React routing
app.get('*', (req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
