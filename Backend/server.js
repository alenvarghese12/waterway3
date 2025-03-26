// Serve static files from the 'public' directory
app.use(express.static('public'));

// Serve ML Python Server directory for the service launcher
app.use('/Backend/ml_python_server', express.static(path.join(__dirname, 'ml_python_server'))); 