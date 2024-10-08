const fs = require("node:fs");
const path = require("node:path");

module.exports = () => {
	global.currentTrackId = null;

	const iconPath =
		global.config.iconPath || path.join(configFolder, "icon.png");

	if (fs.existsSync(iconPath)) {
		infoLog("Deleting the song icon");

		fs.unlinkSync(iconPath);
	}
};
