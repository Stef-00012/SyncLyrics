module.exports = (...args) => {
	if ((logLevels[global.config.logLevel] || 0) < logLevels.info) return;

	console.info("\x1b[34;1mINFO:\x1b[0m", ...args);
};
