const Path = require('path');
const fs = require('fs');

const _buildStyleFilePathLookup = function(path, outerAcc, imageDirectoryPath) {
    const outerPath = imageDirectoryPath || path;   // original `path` arg is persisted through recursion

    return fs.readdirSync(path).reduce((acc, name) => {
        if (fs.lstatSync(Path.join(path, name)).isDirectory() ) {
            return _buildStyleFilePathLookup(
                Path.join(path, name), 
                acc, 
                outerPath
            );
        }
        else if (/\.s?css$/i.test(name)) {
            let subPath = Path.join(path, name).split(/css(.*)/s)[1];  // splits only on first occurance
            subPath = subPath.substring(1);
            
            const parsedPath = Path.parse(subPath);
            const filename = parsedPath['dir'] ? Path.join(parsedPath['dir'], parsedPath['base']) : parsedPath['base'];

            let pathName = parsedPath['name'];
        
            if (parsedPath['dir']) {
                pathName = Path.join(parsedPath['dir'], parsedPath['name']);
            }
console.log(pathName);

            return { 
                ...acc, 
                [Path.join('css', pathName) + '.css']: Path.resolve(__dirname, Path.join(outerPath, subPath))
            };
        }
        else {
            return acc;
        }
    }, outerAcc);
};

const buildStyleFilePathLookup = function(archesStylePath, projectStylePath) {
    const coreArchesStyleFilePathConfiguration = _buildStyleFilePathLookup(archesStylePath, {});
    // const projectStylePathConfiguration = _buildStyleFilePathLookup(publicPath, projectStylePath, {});

    return { 
        ...coreArchesStyleFilePathConfiguration,
        // ...projectStylePathConfiguration 
    };
};

module.exports = { buildStyleFilePathLookup };
