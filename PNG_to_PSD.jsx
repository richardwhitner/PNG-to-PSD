#target photoshop

main();

function main() {
    var rootFolder = Folder.selectDialog("Select a root folder containing subfolders with PNG files");

    if (rootFolder === null) {
        alert("No folder selected. Exiting.");
        return;
    }

    var subfolders = rootFolder.getFiles(function (file) {
        return file instanceof Folder;
    });

    if (subfolders.length === 0) {
        alert("No subfolders found in the selected folder.");
        return;
    }

    for (var i = 0; i < subfolders.length; i++) {
        processSubfolder(subfolders[i]);
    }

    alert("Finished processing subfolders.");
}

function processSubfolder(subfolder) {
    var pngFiles = subfolder.getFiles('*.png');

    if (pngFiles.length === 0) {
        return;
    }

    var sortedFiles = sortFilesByNumber(pngFiles);
    var firstFile = File(sortedFiles[0]);
    var firstImage = open(firstFile);
    var doc = app.documents.add(firstImage.width, firstImage.height, 72, "Combined PSD", NewDocumentMode.RGB, DocumentFill.TRANSPARENT);
    firstImage.close(SaveOptions.DONOTSAVECHANGES);

    for (var i = sortedFiles.length - 1; i >= 0; i--) {
        createLayerFromFile(doc, sortedFiles[i]);
    }

    doc.layers[doc.layers.length - 1].remove(); // Remove the initial empty layer

    var saveFolder = subfolder.parent;
    var saveFileName = subfolder.name;
    savePSD(saveFolder, saveFileName);
    closeAllDocuments();
}

function createLayerFromFile(targetDoc, file) {
    var image = open(file);
    image.activeLayer.copy();
    app.activeDocument = targetDoc;
    var newLayer = targetDoc.artLayers.add();
    targetDoc.activeLayer = newLayer;
    targetDoc.paste();
    newLayer.name = getLayerNameFromFile(file);
    image.close(SaveOptions.DONOTSAVECHANGES);
}

function getLayerNameFromFile(file) {
    var fileName = file.name;
    var baseName = fileName.replace(/_[0-9]+\.png$/, '');
    return baseName;
}

function sortFilesByNumber(files) {
    return files.sort(function(a, b) {
        var aNumber = parseInt(a.name.split('_').pop());
        var bNumber = parseInt(b.name.split('_').pop());
        return aNumber - bNumber;
    });
}

function savePSD(folder, fileName) {
    var saveFile = new File(folder + '/' + fileName + '.psd');
    var saveOptions = new PhotoshopSaveOptions();
    saveOptions.layers = true;
    saveOptions.embedColorProfile = true;
    saveOptions.alphaChannels = true;
    app.activeDocument.saveAs(saveFile, saveOptions, true, Extension.LOWERCASE);
    app.activeDocument.close(SaveOptions.DONOTSAVECHANGES);
}

function closeAllDocuments() {
    while (app.documents.length > 0) {
        app.activeDocument.close(SaveOptions.DONOTSAVECHANGES);
    }
}
