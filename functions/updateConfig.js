const fs = require("node:fs");

module.exports = () => {
	if (!fs.existsSync(global.configFile)) {
		try {
			fs.writeFileSync(
				global.configFile,
				JSON.stringify(global.config, null, 4),
			);
		} catch (e) {
			debugLog("Something went wrong while creating the config file...", e);

			process.exit(0);
		}
	}

	const configFileContent = fs.readFileSync(global.configFile, "utf-8");

	let newConfig = {};

	try {
		newConfig = JSON.parse(configFileContent);
	} catch (e) {
		debugLog("Config file is not a valid JSON");

		process.exit(0);
	}

	const isConfigValid = validateConfig(newConfig);

	if (!isConfigValid) return;

	global.config = newConfig;
};
