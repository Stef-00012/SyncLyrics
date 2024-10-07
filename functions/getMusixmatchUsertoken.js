const fs = require("node:fs");
const path = require("node:path");
const debugLog = require("./debugLog");
const sleep = require("node:util").promisify(setTimeout);

module.exports = async (cookies) => {
	debugLog("Getting Musixmatch token...");

	const tokenFile = path.join(global.configFolder, "musixmatchToken.json");

	if (fs.existsSync(tokenFile)) {
		debugLog("Token file found, checking if it is valid...");

		const fileContent = fs.readFileSync(tokenFile);

		try {
			const data = JSON.parse(fileContent);

			debugLog(
				"Token file is valid, checking if the token is not expired and has all the required fields...",
			);

			if (data.usertoken && data.cookies && data.expiresAt > Date.now()) {
				debugLog("Got token from the token file");

				return data;
			}
		} catch (e) {
			debugLog(
				"Something went wrong while reading the token file, deleting it...",
			);

			try {
				fs.unlinkSync(tokenFile);
			} catch (e) {
				debugLog("Something went wrong while deleting the token file...");
			}
		}
	}

	if (global.fetchingMxmToken) return null;

	debugLog("Fetching the token from the API...");

	const url =
		"https://apic-desktop.musixmatch.com/ws/1.1/token.get?user_language=en&app_id=web-desktop-app-v1.0";

	try {
		const res = await fetch(url, {
			redirect: "manual",
			headers: {
				cookie: cookies,
			},
		});

		if (res.status === 301) {
			debugLog("Successfully received the 'set-cookie' redirect response");

			const setCookie = res.headers
				.getSetCookie()
				.map((cookie) => cookie.split(";").shift())
				.filter((cookie) => cookie.split("=").pop() !== "unknown")
				.join("; ");

			debugLog("Re-fetching with the cookies...");

			return await getMusixmatchUsertoken(setCookie);
		}

		if (!res.ok) {
			debugLog(
				`The usertoken API request failed with the status ${res.status} (${res.statusText})`,
			);

			return null;
		}

		const data = await res.json();

		if (
			data?.message?.header?.status_code === 401 &&
			data?.message?.header?.hint === "captcha"
		) {
			debugLog(
				"Musixmatch usertoken endpoint is being ratelimited, retrying in 10 seconds...",
			);

			await sleep(10000); // wait 10 seconds

			debugLog("Retrying to fetch the Musixmatch usertken...");

			global.fetchingMxmToken = false;

			return await getMusixmatchUsertoken(cookies);
		}

		const usertoken = data?.message?.body?.user_token;

		if (!usertoken) {
			debugLog("The API response did not include the usertoken");

			return;
		}

		const json = {
			cookies,
			usertoken,
			expiresAt: new Date(Date.now() + 10 * 60 * 1000).getTime(), // 10 minutes
		};

		fs.writeFileSync(tokenFile, JSON.stringify(json, null, 4));

		global.fetchingMxmToken = false;

		debugLog("Successfully fetched the usertoken", json);

		return json;
	} catch (e) {}
};
