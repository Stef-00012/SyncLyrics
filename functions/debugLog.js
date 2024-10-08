module.exports = (...args) => {
	if ((logLevels[global.config.logLevel] || 0) < logLevels.debug) return;

	console.debug("\x1b[35;1mDEBUG:\x1b[0m", ...args);
};
