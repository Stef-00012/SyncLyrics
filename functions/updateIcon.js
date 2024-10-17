const path = require("node:path");
const fs = require("node:fs");

module.exports = async (metadata) => {
	const url = metadata.iconUrl;

	if (global.fetchingIcon) return null;

	debugLog("Song icon URL:", url);

	if (!url) {
		deleteIcon();

		return null;
	}

	infoLog("Fetching song icon");

	const iconPath =
		global.config.iconPath || path.join(configFolder, "icon.png");

	global.fetchingIcon = true

	if (["http://", "https://"].some((iconUrl) => url.startsWith(iconUrl))) {
		try {
			let error = false;

			debugLog('Running fetch - Song icon')
			const res = await fetch(url)

			const arrayBuffer = await res.arrayBuffer()
			
			const buffer = Buffer.from(arrayBuffer);

			try {
				fs.writeFileSync(iconPath, buffer);
			} catch (e) {
				errorLog("Something went wrong while saving the song icon", e);

				deleteIcon();

				error = true;
			}

			global.fetchingIcon = false

			if (error) return null;
		} catch (e) {
			errorLog("Something went wrong while fetching the icon URL", e);

			deleteIcon();

			global.fetchingIcon = false

			return null;
		}
	} else if (url.startsWith("file://")) {
		const path = new URL(url).pathname;

		try {
			fs.copyFileSync(path, iconPath);

			global.fetchingIcon = false
		} catch (e) {
			errorLog("Something went wrong while copying the file", e);

			deleteIcon();

			global.fetchingIcon = false

			return null;
		}
	}
};
