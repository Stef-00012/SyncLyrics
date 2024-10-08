module.exports = (...args) => {
	if ((logLevels[global.config.logLevel] || 0) < logLevels.warn) return;

	console.warn("\x1b[33;1mWARNING:\x1b[0m", ...args);
};
