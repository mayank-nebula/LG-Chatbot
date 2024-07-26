const { getAccessibleFiles } = require('../utils/userPermissions');
const fs = require('fs');
const csv = require('csv-parser');
const path = require("path");

exports.getAccessibleDocuments = async (req, res, next) => {
    try {
        const userLookupId = req.query.userLookupId;
        const accessibleFiles = await getAccessibleFiles('/home/Mayank.Sharma/GV_Test/backend/express/utils/users_permission.csv', '/home/Mayank.Sharma/GV_Test/backend/express/utils/deliverables_list.csv', '194');
        const accessibleFilesByTitle = accessibleFiles.map((file) => file.Title);
        const accessibleFilesByFilters = accessibleFiles.map(file => (
            // console.log(cleanDocument(file.StrategyArea))
            {
                // id:file.id,
                title: path.parse(file.ExtractedName).name,
                region: cleanDocument(file.Region),
                country: cleanDocument(file.Country),
                strategyArea: cleanDocument(file.StrategyArea),
            }
        ))
        console.log(accessibleFilesByFilters.length);
        res.status(200).json({ files: accessibleFilesByFilters, message: "documents retrieved" });
    } catch (err) {
        console.log(err);
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}

exports.getFilters = async (req, res, next) => {
    try {
        // const { filtersList } = req.query.filters;
        const filters = await fetchFilters('/home/Mayank.Sharma/GV_Test/backend/express/utils/deliverables_list.csv', ['Region', 'Country', 'StrategyArea']);
        res.status(200).json({ filters: filters, message: "filters retrieved" });
    } catch (err) {
        console.log(err);
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}

const cleanDocument = (document) => {

    if (document) {
        try {
            const jsonString = document.replace(/'/g, '"').replace(/"s/g, "'s");
            const cellValueArray = JSON.parse(jsonString);
            return cellValueArray;
        } catch (error) {
            console.log(`Error parsing JSON in column: `, error);
        }
    }

}

const fetchFilters = async (filepath, columnNames) => {
    return new Promise((resolve, reject) => {
        const uniqueValues = {};

        columnNames.forEach(columnName => {
            uniqueValues[columnName] = new Set();
        });

        fs.createReadStream(filepath)
            .pipe(csv())
            .on('data', (row) => {
                columnNames.forEach(columnName => {
                    if (row[columnName]) {
                        try {
                            const jsonString = row[columnName].replace(/'/g, '"');
                            const cellValueArray = JSON.parse(jsonString);
                            if (Array.isArray(cellValueArray)) {
                                cellValueArray.forEach(item => {
                                    if (item.LookupValue) {
                                        uniqueValues[columnName].add(item.LookupValue);
                                    }
                                })
                            }
                            else console.log(`Invalid JSON array structure in column ${columnName}:`, row[columnName])
                        } catch (error) {
                            console.log(`Error parsing JSON in column ${columnName}:`, error);
                        }
                    }
                })
            })
            .on('end', () => {
                const filters = columnNames.map(columnName => ({
                    column: columnName,
                    values: Array.from(uniqueValues[columnName])
                }));
                resolve(filters);
            })
            .on('error', (error) => {
                reject(error);
            })
    })
}
