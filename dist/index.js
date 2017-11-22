"use strict";

var program = require("commander");
var fs = require("file-system");

// Initialize our "db" - really just a directory of files
var databasePath = "db";
fs.mkdir(databasePath);

program.command("DEPEND <pack> [packs...]").action(function (pack, packs) {
	console.log("Package %s, ", pack);
	// create a file for the package
	// append the dependencies to the package specified
	fs.writeFile(databasePath + "/" + pack);

	if (packs) {
		packs.forEach(function (p) {
			console.log("Another package: ", p);
		});
	}
});

// program
// 	.command("INSTALL <package>")
// 	.description(
// 		"Takes 1 argument. Implicitly install any unmet dependencies, and then explicitly install <package>." +
// 		"If <package> is already installed, echo that feedback."
// 	)
// 	.action(function(package, packages) {
// 		console.log("Package %s, ", package);
// 		if (packages) {
// 			packages.forEach(function(p) {
// 				console.log("Another package: ", p);
// 			});
// 		}
// 	});

program.parse(process.argv);