const path = require("node:path");
const fs = require("node:fs");

module.exports = (metadata) => {
	const url = metadata.iconUrl;

	debugLog("Song icon URL:", url)

	if (!url) {
		deleteIcon();

		return null;
	}

	infoLog("Fetching song icon");

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
						errorLog("Something went wrong while saving the song icon", e);

						deleteIcon();

						error = true;
					}
				});

			if (error) return null;
		} catch (e) {
			errorLog("Something went wrong while fetching the icon URL", e);

			deleteIcon();

			return null;
		}
	} else if (url.startsWith("file://")) {
		const path = new URL(url).pathname;

		try {
			fs.copyFileSync(path, iconPath);
		} catch (e) {
			errorLog("Something went wrong while copying the file", e);

			deleteIcon();

			return null;
		}
	}
};
