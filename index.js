var program = require("commander");
var fs = require("file-system");

// Initialize our "db" - really just a directory of files
const databasePath = "db";
fs.mkdir(databasePath);

program
	.command("DEPEND <pack> [packs...]")
	.action(function(pack, packs) {
		// create a file for the package
		// append the dependencies in the file
		const path = `${databasePath}/${pack}`;
		if (!fs.existsSync(path)) {
			if (packs) {
				var otherPacks = "Dependecies: ";
				packs.forEach(function(p) {
					otherPacks = otherPacks.concat(p + " ");
				});
				otherPacks = otherPacks.concat("\nRequired by: " + pack);
				otherPacks = otherPacks.concat("\nInstalled: ");
				fs.writeFile(path, otherPacks);
			} else {
				fs.writeFile(path, packs[0]);
			}
		} else {
			console.log(`The package ${pack} already exists in the dependencies`);
		}
	});

program
	.command("INSTALL <pack>")
	.description(
		"Takes 1 argument. Implicitly install any unmet dependencies, and then explicitly install <package>." +
		"If <package> is already installed, echo that feedback."
	)
	.action(function(pack) {

		// append the install line in the file if it exists, if not then create a new file for the package
		const path = `${databasePath}/${pack}`;
		if (fs.existsSync(path)) {
			const fileContents = fs.readFileSync(path, "utf8");

			// Check the install file contents for the package by looking at the install row
			var newFileContents = fileContents;
			var installedByRow = newFileContents.split("\n").pop();
			var installedPackages = installedByRow.split(" ").slice(1);

			if (installedPackages && !installedPackages.includes(pack)) {
				console.log(`Installing ${pack}`);
				installedPackages.push(pack);
			} else {
				console.log(`The package ${pack} is already installed`);
			}

			fs.appendFileSync(path, installedByRow);
		} else {
			fs.writeFile(path, "");
		}
	});

program.parse(process.argv);