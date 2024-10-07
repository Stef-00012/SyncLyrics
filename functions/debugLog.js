module.exports = (...args) => {
	if (
		global.config.debug ||
		process.env.DEBUG?.toLowerCase() === "true" ||
		process.argv.includes("--debug")
	)
		console.debug("\x1b[35;1mDEBUG:\x1b[0m", ...args);
};
