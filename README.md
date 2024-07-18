const accessibleFilesByFilters = accessibleFiles.map(file => (
            // console.log(cleanDocument(file.StrategyArea))
            {
                // id:file.id,
                title: file.ExtractedName,
                region: cleanDocument(file.Region),
                country: cleanDocument(file.Country),
                strategyArea: cleanDocument(file.StrategyArea),
            }
        ))
