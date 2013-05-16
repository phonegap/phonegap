/*
 * Script for zipping the contents of a directory.
 */

// get commman line arguments
var objArgs = WScript.Arguments;
var zipPath = objArgs(0);
var sourcePath = objArgs(1);


// create empty ZIP file and open for adding
var fso = new ActiveXObject("Scripting.FileSystemObject");
var file = fso.CreateTextFile(zipPath, true);

// create twenty-two byte "fingerprint" for .zip
file.write("PK");
file.write(String.fromCharCode(5));
file.write(String.fromCharCode(6));
file.write('\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0');
file.Close();

// open .zip foder and copy contents of sourcePath
var objShell = new ActiveXObject("shell.application");
var zipFolder = objShell.NameSpace(zipPath);
var sourceItems = objShell.NameSpace(sourcePath).items();
if (zipFolder !== null) {
    zipFolder.CopyHere(sourceItems, 4|20|16);
    WScript.Sleep(4000);
}
else {
	WScript.StdErr.WriteLine('Failed to create .zip file.');
}