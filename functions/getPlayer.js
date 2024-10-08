const { execSync } = require("node:child_process");

module.exports = (skipPaused = true, offset = 0) => {
	debugLog(`getPlayer: skipPaused = ${skipPaused}, offset = ${offset}`);

	let players;

	try {
		players = execSync("playerctl --list-all").toString().trim();
	} catch (e) {
		errorLog("Something went wrong while getting the list of players", e);

		return null;
	}

	const playersList = players
		.split("\n")
		.map((player) => player.split(".").shift())
		.filter((player) => {
			if (global.config.ignoredPlayers?.includes(player)) return false;

			return true;
		})
		.sort((a, b) => {
			const aIsFavorite = global.config.favoritePlayers?.includes(a);
			const bIsFavorite = global.config.favoritePlayers?.includes(b);
			const aIsHated = global.config.hatedPlayers?.includes(a);
			const bIsHated = global.config.hatedPlayers?.includes(b);

			if (aIsFavorite && !bIsFavorite) return -1;
			if (!aIsFavorite && bIsFavorite) return 1;

			if (aIsHated && !bIsHated) return 1;
			if (!aIsHated && bIsHated) return -1;

			return 0;
		});

	debugLog("Avaible Players", playersList);

	if (playersList.length <= 0) return null;

	for (const player of playersList) {
		if (!skipPaused) {
			if (offset > 0) {
				offset--;

				continue;
			}

			return player;
		}

		try {
			const isPlaying =
				execSync(`playerctl -p ${player} status`).toString().trim() ===
				"Playing";

			if (!isPlaying) continue;
		} catch (e) {
			continue;
		}

		if (offset > 0) {
			offset--;

			continue;
		}

		return player;
	}

	return null;
};
