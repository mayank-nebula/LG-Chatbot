const outputFilePath = path.join(__dirname, "..", "output", "filenames.txt");
    const fileStream = fs.createWriteStream(outputFilePath, { flags: "w" }); // 'w' to overwrite the file, 'a' to append

    accessibleFilesByFilters.forEach(file => {
      fileStream.write(`${file.title}\n`); // Writing each filename in a new row
    });

    fileStream.end(); 
