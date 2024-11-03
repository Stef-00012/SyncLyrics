const fs = require("node:fs");

module.exports = () => {
	if (!fs.existsSync(global.configFile)) {
		try {
			fs.writeFileSync(
				global.configFile,
				JSON.stringify(global.config, null, 4),
			);
		} catch (e) {
			errorLog("Something went wrong while creating the config file...", e);

			process.exit(0);
		}
	}

	const configFileContent = fs.readFileSync(global.configFile, "utf-8");

	let newConfig = {};

	try {
		newConfig = JSON.parse(configFileContent);
	} catch (e) {
		errorLog("Config file is not a valid JSON");

		process.exit(0);
	}

	const isConfigValid = validateConfig(newConfig);

	if (!isConfigValid) return;

	LyricsManager
		.setLogLevel(newConfig.logLevel)
		.setInstrumentalLyricsIndicator(newConfig.instrumentalLyricIndicator)
		.setSources(newConfig.sourceOrder)

	global.config = newConfig;
};
