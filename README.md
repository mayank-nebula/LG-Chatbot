const accessibleFilesByFilters = accessibleFiles
            .filter(file => allowedExtensions.includes(path.extname(file.ExtractedName).toLowerCase()))
            .map(file => ({
                title: path.parse(file.ExtractedName).name,
                region: cleanDocument(file.Region),
                country: cleanDocument(file.Country),
                strategyArea: cleanDocument(file.StrategyArea),
            }));
