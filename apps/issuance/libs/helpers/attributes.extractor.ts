import { CommonConstants } from '@credebl/common/common.constant';
import { TemplateIdentifier } from '@credebl/enum/enum';

// Function for extracting attributes from nested structure
export function extractAttributeNames(
  attributeObj,
  parentKey: string = '',
  result: Set<string> = new Set(),
  inNestedArray: boolean = false
): string[] {
  if (Array.isArray(attributeObj)) {
    attributeObj.forEach((item) => {
      extractAttributeNames(item, parentKey, result, inNestedArray);
    });
  } else if ('object' === typeof attributeObj && null !== attributeObj) {
    let newParentKey = parentKey;

    if (attributeObj.hasOwnProperty('attributeName')) {
      newParentKey = parentKey
        ? `${parentKey}${CommonConstants.NESTED_ATTRIBUTE_SEPARATOR}${attributeObj.attributeName}`
        : attributeObj.attributeName;
    }

    if (attributeObj.hasOwnProperty('items') && Array.isArray(attributeObj.items)) {
      // Always use index 0 for items in an array
      attributeObj.items.forEach((item) => {
        extractAttributeNames(item, `${newParentKey}${CommonConstants.NESTED_ATTRIBUTE_SEPARATOR}0`, result, true);
      });
    } else if (attributeObj.hasOwnProperty('properties')) {
      Object.entries(attributeObj.properties).forEach(([key, value]) => {
        const propertyKey = `${newParentKey}${CommonConstants.NESTED_ATTRIBUTE_SEPARATOR}${key}`;
        extractAttributeNames(value, propertyKey, result, inNestedArray);
      });
    } else {
      Object.entries(attributeObj).forEach(([key, value]) => {
        if (!['attributeName', 'items', 'properties'].includes(key)) {
          extractAttributeNames(value, newParentKey, result, inNestedArray);
        }
      });
    }
  } else {
    result.add(parentKey);
  }

  return Array.from(result);
}

// Handles both explicitly indexed arrays and implicit arrays
function mergeArrayObjects(obj): void {
  if (!obj || 'object' !== typeof obj) {
    return;
  }

  // First pass: Convert objects with numeric keys to arrays
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];

      // Skip non-objects
      if (!value || 'object' !== typeof value) {
        continue;
      }

      // Process arrays
      if (Array.isArray(value)) {
        value.forEach((item) => {
          if (item && 'object' === typeof item) {
            mergeArrayObjects(item);
          }
        });
      } else {
        // Process objects
        // Check if this object has numeric keys
        const keys = Object.keys(value);
        const numericKeys = keys.filter((k) => /^\d+$/.test(k));

        if (0 < numericKeys.length) {
          // Has numeric keys - convert to array
          const tempArray = [];

          // First, add all numeric keys to the array
          numericKeys
            .sort((a, b) => parseInt(a) - parseInt(b))
            .forEach((k) => {
              const index = parseInt(k);
              tempArray[index] = value[k];

              // Process recursively
              if (value[k] && 'object' === typeof value[k]) {
                mergeArrayObjects(value[k]);
              }
            });

          // Then add all non-numeric keys to every array element
          const nonNumericKeys = keys.filter((k) => !/^\d+$/.test(k));
          if (0 < nonNumericKeys.length) {
            tempArray.forEach((item, index) => {
              if (!item || 'object' !== typeof item) {
                tempArray[index] = {};
              }

              nonNumericKeys.forEach((k) => {
                tempArray[index][k] = value[k];
              });
            });
          }

          // Replace the object with our array
          obj[key] = tempArray;
        } else {
          // No numeric keys - process recursively
          mergeArrayObjects(value);
        }
      }
    }
  }

  // Second pass: Look for arrays with objects that have common prefixes with numeric suffixes
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      if (Array.isArray(obj[key])) {
        // Look for patterns like "field1", "field2" in each array element
        obj[key].forEach((item) => {
          if (item && 'object' === typeof item) {
            const keys = Object.keys(item);
            const prefixMap = new Map();

            // Group keys by prefix
            keys.forEach((k) => {
              const match = k.match(/^([^0-9]+)(\d{1,10})$/);
              if (match) {
                // eslint-disable-next-line prefer-destructuring
                const prefix = match[1];
                const index = parseInt(match[2]);
                if (!prefixMap.has(prefix)) {
                  prefixMap.set(prefix, []);
                }
                prefixMap.get(prefix).push({ key: k, index });
              }
            });

            // Convert grouped prefixes to arrays
            for (const [prefix, matches] of prefixMap.entries()) {
              if (0 < matches.length) {
                const tempArray = [];

                // Sort by index and populate array
                matches
                  .sort((a, b) => a.index - b.index)
                  .forEach((match) => {
                    tempArray[match.index] = item[match.key];
                    delete item[match.key];
                  });

                // Set the array on the item
                item[prefix] = tempArray;
              }
            }

            // Process recursively
            mergeArrayObjects(item);
          }
        });
      }
    }
  }
}

// Helper function to process remaining parts of a key path
function processRemainingParts(obj, parts: string[], value): void {
  let current = obj;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];

    // If this is the last part, set the value
    if (i === parts.length - 1) {
      current[part] = value;
      return;
    }

    // Check if next part is a number (array index)
    const isNextPartNumeric = i < parts.length - 1 && !isNaN(Number(parts[i + 1]));

    if (isNextPartNumeric) {
      // This is an array index, create array if needed
      if (!current[part]) {
        current[part] = [];
      }

      const index = parseInt(parts[i + 1]);
      while (current[part].length <= index) {
        current[part].push({});
      }

      // Update the local variable instead of the parameter
      current = current[part][index];
      i++; // Skip the index part
    } else {
      // This is a regular object property
      if (!current[part]) {
        current[part] = {};
      }

      current = current[part];
    }
  }
}

// Function to convert a flattened CSV row into a nested object
export function unflattenCsvRow(row: object): object {
  const result: object = {};
  const groupedKeys: Record<string, string[]> = {};

  // First pass: handle simple keys and identify complex keys
  for (const key in row) {
    if (Object.prototype.hasOwnProperty.call(row, key)) {
      // Skip empty values
      if ('' === row[key]) {
        continue;
      }

      // Handle email identifier specially
      if (TemplateIdentifier.EMAIL_COLUMN === key) {
        result[key] = row[key];
        continue;
      }

      const keyParts = key.split(CommonConstants.NESTED_ATTRIBUTE_SEPARATOR);

      // Handle array notation: key~index~otherParts
      if (1 < keyParts.length && !isNaN(Number(keyParts[1]))) {
        // eslint-disable-next-line prefer-destructuring
        const arrayName = keyParts[0];
        // eslint-disable-next-line prefer-destructuring
        const arrayIndex = keyParts[1];
        const groupKey = `${arrayName}${CommonConstants.NESTED_ATTRIBUTE_SEPARATOR}${arrayIndex}`;

        if (!groupedKeys[groupKey]) {
          groupedKeys[groupKey] = [];
        }
        groupedKeys[groupKey].push(key);
      } else {
        // Handle implicit array notation or simple nested keys

        // Check if this key has any numeric part that might indicate an array
        const hasArrayPart = keyParts.some((part, index) => 0 < index && !isNaN(Number(part)) && '' !== part);

        if (hasArrayPart) {
          // Handle as potential array, but we'll process it in the second pass
          if (!groupedKeys[keyParts[0]]) {
            groupedKeys[keyParts[0]] = [];
          }
          groupedKeys[keyParts[0]].push(key);
        } else {
          // Handle as simple nested key (no arrays)
          let currentLevel = result;
          for (let i = 0; i < keyParts.length; i++) {
            const part = keyParts[i];
            if (i === keyParts.length - 1) {
              currentLevel[part] = row[key];
            } else {
              if (!currentLevel[part]) {
                currentLevel[part] = {};
              }
              currentLevel = currentLevel[part];
            }
          }
        }
      }
    }
  }

  // Second pass: process explicitly indexed arrays
  for (const grpKey in groupedKeys) {
    if (Object.prototype.hasOwnProperty.call(groupedKeys, grpKey)) {
      const keys = groupedKeys[grpKey];

      // For explicit indexed arrays (format: arrayName~index~...)
      if (grpKey.includes(CommonConstants.NESTED_ATTRIBUTE_SEPARATOR)) {
        const [arrayName, arrayIndex] = grpKey.split(CommonConstants.NESTED_ATTRIBUTE_SEPARATOR);

        if (!result[arrayName]) {
          result[arrayName] = [];
        }

        const index = parseInt(arrayIndex);
        while (result[arrayName].length <= index) {
          result[arrayName].push({});
        }

        for (const key of keys) {
          const keyParts = key.split(CommonConstants.NESTED_ATTRIBUTE_SEPARATOR);
          const remainingParts = keyParts.slice(2);
          const currentLevel = result[arrayName][index];

          processRemainingParts(currentLevel, remainingParts, row[key]);
        }
      } else {
        // For implicit arrays (format: arrayName~field~0~...)
        const arrayName = grpKey;

        if (!result[arrayName]) {
          result[arrayName] = {};
        }

        for (const key of keys) {
          const keyParts = key.split(CommonConstants.NESTED_ATTRIBUTE_SEPARATOR);
          const remainingParts = keyParts.slice(1);
          const currentLevel = result[arrayName];

          processRemainingParts(currentLevel, remainingParts, row[key]);
        }
      }
    }
  }

  mergeArrayObjects(result);
  return result;
}
