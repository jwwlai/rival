#!/usr/bin/env node

var program = require("commander");
var fs = require("file-system");

// constants
const DEPENDENCIES = "dependencies";

// Initialize our "db" - really just a directory of files
const databasePath = "db";
fs.mkdir(databasePath);

program
	.command("DEPEND <pack> [packs...]")
	.action(function(pack, packs) {
		const path = `${databasePath}/${pack}`;

		// Add to dependencies list
		if (fs.existsSync(path)) {
			const dependencies = getFileField(pack, DEPENDENCIES);
			packs.forEach((item) => {
				if (!dependencies.includes(item)) {
					dependencies.push(item);
				}
			});
			writeToField(pack, DEPENDENCIES, dependencies);
		} else {
			var packJSON = {
				dependencies: packs,
				requiredBy: [],
				installed: { explicit: false, implicit: false }
			};
			fs.writeFileSync(path, JSON.stringify(packJSON));
		}

		// Add to requiredBy list
		packs.forEach((item) => {
			const dependencyPath = `${databasePath}/${item}`;
			if (fs.existsSync(dependencyPath)) {
				let requiredBy = getFileField(item, "requiredBy");
				const isAlreadyRequired = requiredBy.filter((item) => item === pack);
				if (isAlreadyRequired.length === 0) {
					requiredBy.push(pack);
				}
				writeToField(item, "requiredBy", requiredBy);
			} else {
				var packJSON = {
					dependencies: [],
					requiredBy: [pack],
					installed:  { explicit: false, implicit: false }
				};
				fs.writeFileSync(dependencyPath, JSON.stringify(packJSON));
			}
		});
	});

program
	.command("INSTALL <pack>")
	.action(function(pack) {
		const path = `${databasePath}/${pack}`;
		if (fs.existsSync(path)) {
			const fileContents = JSON.parse(fs.readFileSync(path));

			// Implicitly install dependencies recursively
			const dependencies = fileContents[DEPENDENCIES];
			install(dependencies);

			// Explicitly install package
			if (isPackageInstalled(pack)) {
				console.log(`Package ${pack} is already installed.`);
			} else {
				console.log(`Installing ${pack}...`);
				writeToField(pack, "installed", { explicit: true, implicit: false });
			}
		} else {
			console.log(`Installing ${pack}...`);
			var initPackJSON = {
				dependencies: [],
				requiredBy: [],
				installed: { explicit: true, implicit: false }
			};
			fs.writeFileSync(path, JSON.stringify(initPackJSON));
		}
	});

program
	.command("REMOVE <pack>")
	.action(function(pack) {
		const path = `${databasePath}/${pack}`;
		if (fs.existsSync(path)) {
			remove(pack);
		} else {
			console.log(`${pack} does not exist`);
		}
	});

program
	.command("LIST")
	.action(function() {
		fs.readdirSync(databasePath).filter((file) => {
			if (isPackageInstalled(file)) {
				console.log(file);
			}
		});
	});

program.parse(process.argv);

// Helpers

function install(dependencies) {
	if (dependencies && dependencies.length > 0) {
		dependencies.forEach((dep) => {
			const depsList = getFileField(dep, DEPENDENCIES);

			// mark installed
			if (!isPackageInstalled(dep)) {
				console.log(`Installing ${dep}...`);
				writeToField(dep, "installed", { explicit: false, implicit: true });
			}

			// recurse with new list of deps
			install(depsList);
		});
	}
	return;
}

function remove(pack) {
	if (isPackageInstalled(pack)) {
		// 1. check if it's required by anything and see if any of them are installed
		const packagesRequired = getFileField(pack, "requiredBy");
		const isRequired = packagesRequired.length > 0;
		if (isRequired && isAnyInstalled(packagesRequired)) {
			console.log(`Package ${pack} is still needed - cannot remove.`);
		} else {
			// If none of the required by packages are installed, uninstall package and start over with its dependencies.
			console.log(`Removing ${pack}...`);
			writeToField(pack, "installed", { explicit: false, implicit: false });

			// Only remove implicitly installed packages
			getFileField(pack, DEPENDENCIES)
				.filter((dep) => {
					return isImplicitlyInstalled(dep) === true;
				})
				.forEach((dep) => {
					remove(dep);
				});
		}
	} else {
		console.log(`${pack} is not installed.`);
	}
}

function isPackageInstalled(pack) {
	return isExplicitlyInstalled(pack) || isImplicitlyInstalled(pack);
}

function isExplicitlyInstalled(pack) {
	return getFileField(pack, "installed")["explicit"];
}

function isImplicitlyInstalled(pack) {
	return getFileField(pack, "installed")["implicit"];
}

function isAnyInstalled(list) {
	return list.some((item) => { return isPackageInstalled(item) });
}

function getFileField(pack, field) {
	const fileContents = JSON.parse(fs.readFileSync(`${databasePath}/${pack}`));
	return fileContents[field];
}

function getFileContents(pack) {
	return JSON.parse(fs.readFileSync(`${databasePath}/${pack}`));
}

function writeToField(pack, field, value) {
	const path = `${databasePath}/${pack}`;
	const contents = getFileContents(pack);
	contents[field] = value;
	fs.writeFileSync(path, JSON.stringify(contents));
}