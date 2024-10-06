# SyncLyrics

> [!IMPORTANT]
> Your Linux distro must support `playerctl`.

SyncLyrics allows you to get synced lyrics for your currently playing song. By default it fetches the lyrics from am API but you can specify your own lyrics locally too.

## How to download?

Just clone this repository

1. `git clone https://gtihub.com/Stef-00012/SyncLyrics`
2. `cd SyncLyrics`

## Usage

`node media.js`.

### Flags

- `--volume-down=X`, `-vol-=X`: Decreases the player's volume by `X`%, or the `defaultVolumeStep` % config if X is not present.
- `--play-toggle`, `-pt`: Plays or pauses the player.
- `--show-lyrics`, `-sl`: Saves the lyrics in a temporary file (`/tmp/lyrics.txt`) and opens the file (when combined with `--save` or `-s` it saves the lyrics in a permanent file, `~/Downloads/syncLyrics/<song_name>-<artist_name>.txt`).
- `--show-cover`, `-sc`: Opens the song's icon in your system default image viewer (when combined with `--save` or `-s` it saves the icon in a permanent file, `~/Downloads/syncLyrics/<song_name>-<artist_name>.png`).
- `--volume-up=X`, `-vol+=X`: Increases the player's volume by `X`%, or the `defaultVolumeStep` % config if X is not present.
- `--trackid`, `-tid`: Returns the song ID (required for local lyrics).
- `--artist`, `-a`: Returns the artist name. `*`
- `--cover`, `-c`: Returns the absolute path to the song's icon image.
- `--data`, `-d`: Returns the song name and artist. `*`
- `--name`, `-n`: Returns the song name. `*`

`*` Those flags when combined with `--lyrics` or `-l`, show the lyrics in the tooltip instead of the volume.

## Config

Default config folder is `~/.config/syncLyrics`, this can be changed by running the script as `CONFIG_FOLDER=/path/to/folder node media.js` (`CONFIG_FOLDER` must be an absolute path).<br />
The config are read from a file `config.json` inside the config folder (create it if it doesn't exist).

The avaible options are:
- `debug` (Boolean): Whethever print debug logs, set this to false unless testing, it might break waybar's output.
- `dataUpdateInterval` (Number): How often update the output returned by the `--data` or `-d` parameter (in milliseconds).
- `nameUpdateInterval` (Number): How often update the output returned by the `--name` or `-n` parameter (in milliseconds).
- `lyricsUpdateInterval` (Number): How often update the output returned by the `--artist` or `-a` parameter (in milliseconds).
- `marqueeMinLength` (Number): Minimum length before the output of `--data`, `-d`, `--name`, `-n`, `--artist` and `-a` becomes a marquee (Scrolling text).
- `tooltipCurrentLyricColor` (String): The color to use for the current lyric in the waybar tooltip.
- `playerSourceColor` (String): The color to use for the lyrics source in the waybar tooltip.
- `ignoredPlayers` (Array\<String>): List of players that will never be used by the script.
- `favoritePlayers` (Array\<String>): List of players that will be prioritized over others.
- `hatedPlayers` (Array\<String>): Opposite of `favoritePlayers`.
- `iconPath` (String): File path the song's icon will be stored in (must be an absolute path).
- `deleteIconWhenPaused` (Boolean): Whetever keep the song icon or not when the player is paused.
- `defaultVolumeStep` (Number): The default step for volume increase/decrease.
- `musixmatch` (Object): `*`
	- `usertoken` (String): Your Musixmatch usertoken. `*`
	- `cookies` (String): Your Musixmatch cookies. `*`
- `sourceOrder` (Array\<String>): The order in which the sources will be fetched.

`*` See [Musixmatch Configuration](https://github.com/Stef-00012/SyncLyrics#musixmatch-configuration)

### Example Config

```json
{
    "debug": false,
    "dataUpdateInterval": 1000,
    "artistUpdateInterval": 1000,
    "nameUpdateInterval": 1000,
    "lyricsUpdateInterval": 500,
    "marqueeMinLength": 30,
    "tooltipCurrentLyricColor": "#cba6f7",
    "playerSourceColor": "#89b4fa",
    "ignoredPlayers": [
        "plasma-browser-integration"
    ],
    "favoritePlayers": [
        "spotify"
    ],
    "hatedPlayers": [
        "chromium"
    ],
    "iconPath": null,
    "deleteIconWhenPaused": true,
	"defaultVolumeStep": 5,
    "musixmatch": {
        "usertoken": null,
        "cookies": null
    },
    "sourceOrder": [
		"musixmatch",
		"lrclib"
	]
}
```

## Waybar Example

This example uses has the `media.js` file located in `~/.config/custom-commands/media.js`

```jsonc
{
    "image": {
		"interval": 1,
		// "size": 26, // (change based on your liking)
		"exec": "node ~/.config/custom-commands/media.js --cover",
		"on-click": "node ~/.config/custom-commands/media.js --show-cover",
		"tooltip": false
	},

	"custom/song": {
		"tooltip": true,
		"format": "{icon} {}",
		"format-icons": {
			"playing": "󰎇 ",
			"none": "󰎊 "
		},
		"return-type": "json",
		"exec-if": "if [ -f ~/.config/custom-commands/media.js ]; then exit 0; else exit 1; fi",
		"restart-interval": 5,
		"exec": "node ~/.config/custom-commands/media.js --data",
		"on-click": "node ~/.config/custom-commands/media.js --play-toggle",
		"on-click-middle": "pgrep -x 'spotify' > /dev/null && wmctrl -a 'Spotify' || spotify &",
		"on-scroll-up": "node ~/.config/custom-commands/media.js --volume-up",
		"on-scroll-down": "node ~/.config/custom-commands/media.js --volume-down",
		"escape": true,
		"exec-on-event": false
	},

	"custom/lyrics": {
		"tooltip": true,
		"format": "{icon} {}",
		"format-icons": {
			"lyrics": "󰲹 ",
			"none": "󰐓 "
		},
		"return-type": "json",
		"exec-if": "if [ -f ~/.config/custom-commands/media.js ]; then exit 0; else exit 1; fi",
		"restart-interval": 5,
		"exec": "node ~/.config/custom-commands/media.js",
		"on-click-middle": "node ~/.config/custom-commands/media.js --show-lyrics",
		"escape": true,
		"hide-empty-text": true,
		"exec-on-event": false
	}
}
```

### Song Name Progress

You can show the progress bar in the `custom/song` module by adding some CSS to your waybar's CSS.<br/>
You can generate the CSS by running `node progress.js <module-name> <active-color> <background-color>`.

For example if you module is `custom/song`, you want as active color `#123456` and and background color `#abcdef`, the command will be `node progress.js song #123456 #abcdef`.<br />
This script will create a `style.css` file with the generated CSS, just paste the generated CSS inside you waybar's CSS config.

## Musixmatch Configuration

To get your `usertoken`, follow [this guide by Spicetify developers](https://spicetify.app/docs/faq/#sometimes-popup-lyrics-andor-lyrics-plus-seem-to-not-work) (stop at step 5) or follow these steps:
1. Download the Musixmatch desktop application.
	- **Windows**:
		\1. Go to [store.rg-adguard.net](https://store.rg-adguard.net/).
		\2. Select "ProductID" on the left.
		\3. In the search box type `9wzdncrfj235` and click the done button
	- **Linux**:
		\1. Find an archive with the Musixmatch desktop app.
2. Download the `.appxbundle` file and run it **(Login is __not__ required)**
3. Open DevTools (`Ctrl + Shift + I`) and go to the "Network" tab.
4. Refresh the page (`Ctrl + R`) and filter the Network tab results by searching `apic`.
5. Click on any result and go to the "Headers" tab.
6. Find the `usertoken` query string parameter.

To get your `cookies`:
1. visit `https://apic-desktop.musixmatch.com//ws/1.1/track.subtitle.get?commontrack_id=10074988&app_id=web-desktop-app-v1.0&usertoken=<USERTOKEN>` (Replace `<USERTOKEN>` with the `usertoken` you got earlier) **(If you are logged into `musixmatch.com`, use an incognito tab to avoid getting useless cookies, the only cookies required are `AWSELB` and `AWSELBCORS`)**.
2. Open the DevTools (`Ctrl + Shift + I`) and go to the "Network" tab.
3. Refresh the page (`Ctrl + R`).
4. Click on any result and go to the "Headers" tab.
5. Find the `cookie` header.

## Local Lyrics

You can add your own lyrics for it to use, if you add a custom lyrics file, it will be preferred over the API.

The lyrics are read from the `$CONFIG_FOLDER/lyrics` folder (`~/.config/syncLyrics` by default), the files in this folder must be named `<track_id>.txt` (Example: `5nAu0J2rlijocTGX8QWo07.txt`) and their content must be formatted as `[mm:ss.xx] <lyrics here>` and each one must be on a new line.

Example:
```txt
[00:00.00] 5th of November
[00:04.03] When I walked you home
[00:08.15] That's when I nearly said it
[00:10.64] But then said "Forget it," and froze
[00:15.68] Do you remember?
[00:19.33] You probably don't
[00:23.32] 'Cause the sparks in the sky
[00:25.51] Took a hold of your eyes while we spoke
```