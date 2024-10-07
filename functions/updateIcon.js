const path = require("node:path");
const fs = require("node:fs");

module.exports = (metadata) => {
	const url = metadata.iconUrl;

	if (!url) {
		deleteIcon();

		return null;
	}

	debugLog("Fetching song icon");

	const iconPath =
		global.config.iconPath || path.join(configFolder, "icon.png");

	if (["http://", "https://"].some((iconUrl) => url.startsWith(iconUrl))) {
		try {
			let error = false;

			fetch(url)
				.then((res) => res.arrayBuffer())
				.then((data) => {
					const buffer = Buffer.from(data);

					try {
						fs.writeFileSync(iconPath, buffer);
					} catch (e) {
						debugLog("Something went wrong while saving the song icon");

						deleteIcon();

						error = true;
					}
				});

			if (error) return null;
		} catch (e) {
			debugLog("Something went wrong while fetching the icon URL");

			deleteIcon();

			return null;
		}
	} else if (url.startsWith("file://")) {
		const path = new URL(url).pathname;

		try {
			fs.copyFileSync(path, iconPath);
		} catch (e) {
			debugLog("Something went wrong while copying the file");

			deleteIcon();

			return null;
		}
	}
};
