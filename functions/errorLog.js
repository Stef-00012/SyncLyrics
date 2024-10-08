module.exports = (...args) => {
	if ((logLevels[global.config.logLevel] || 0) < logLevels.error) return;

	console.error("\x1b[31;1mERROR:\x1b[0m", ...args);
};
