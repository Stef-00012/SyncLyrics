const fs = require("node:fs");
const path = require("node:path");

const moduleName = process.argv[2];
const color1 = process.argv[3];
const color2 = process.argv[4];

const hexRegex = /^#?([a-f0-9]{6}|[a-f0-9]{3})$/;

if (!hexRegex.test(color1) || !hexRegex.test(color2)) {
	console.log(
		"\x1b[31mThe colors must be hexadecimal (eg. #123 or #abcdef, including the #)",
	);

	process.exit(0);
}

if (moduleName.startsWith("#custom-")) {
	console.log(
		"\x1b[31mDo not include #custom- , only the module name (eg. if your module is custom/song, here you'll put song)",
	);

	process.exit(0);
}

const css = [];

for (let i = 0; i <= 100; i++) {
	css.push(`#custom-${moduleName}.perc${i}-0 {
    background-image: linear-gradient(
        to right,
        ${color1} ${i}.0%,
        ${color2} ${i}.1%
    );
}`);
}

const styleFilePath = path.join(__dirname, "style.css");

fs.writeFileSync(styleFilePath, css.join("\n\n"));
