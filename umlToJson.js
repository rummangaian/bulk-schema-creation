const fs = require('fs');

/**
 * Parses a PlantUML class diagram and converts it to JSON.
 * @param {string} plantUml - The PlantUML diagram as a string.
 * @returns {Array} - JSON array representing the classes and their attributes.
 */
function parsePlantUML(plantUml) {
  const classes = [];
  const classRegex = /class\s+(\w+)\s*\{([^}]*)\}/g;
  let match;

  while ((match = classRegex.exec(plantUml)) !== null) {
    const className = match[1];
    const classBody = match[2];
    const attributes = [];

    // Split the class body into lines and process each line
    const lines = classBody.split('\n');
    lines.forEach(line => {
      line = line.trim();

      // Ignore methods (lines with parentheses)
      if (line.includes('(') && line.includes(')')) {
        return;
      }

      // Match attribute lines
      // Handles: +Control_ID: string <<PK>>, Control_Name: string, etc.
      const attrRegex = /^([+#!-]?)(\w+)\s*:\s*([\w<>]+)\s*(<<PK>>)?$/;
      const attrMatch = attrRegex.exec(line);
      if (attrMatch) {
        const prefix = attrMatch[1];
        const name = attrMatch[2];
        const type = attrMatch[3];
        const isPrimaryKey = !!attrMatch[4];

        attributes.push({
          name: name,
          type: type,
          required: prefix === '+', // Required if it starts with +
          primaryKey: isPrimaryKey
        });
      }
    });

    classes.push({
      className: className,
      attributes: attributes
    });
  }

  return classes;
}

/**
 * Reads a PlantUML file and converts it to JSON.
 * @param {string} inputPath - Path to the PlantUML file.
 * @param {string} outputPath - Path to save the JSON output.
 */
function convertUMLToJSON(inputPath, outputPath) {
  fs.readFile(inputPath, 'utf8', (err, data) => {
    if (err) {
      console.error(`Error reading file ${inputPath}:`, err);
      return;
    }

    const jsonData = parsePlantUML(data);
    fs.writeFile(outputPath, JSON.stringify(jsonData, null, 2), 'utf8', err => {
      if (err) {
        console.error(`Error writing file ${outputPath}:`, err);
        return;
      }
      console.log(`Successfully converted UML to JSON and saved to ${outputPath}`);
    });
  });
}

// Example Usage:
// Assuming you have a file named 'diagram.puml' in the same directory
const inputFilePath = 'folder/diagram.puml';
const outputFilePath = 'folder/classes.json';

convertUMLToJSON(inputFilePath, outputFilePath);
