import { CommonConstants } from '@credebl/common/common.constant';
import { TemplateIdentifier } from '@credebl/enum/enum';

export function extractAttributeNames(
    attributeObj,
    parentKey: string = '',
    result: Set<string> = new Set()
): string[] {
    if (Array.isArray(attributeObj)) {
        attributeObj.forEach((item) => {
            extractAttributeNames(item, parentKey, result);
        });
    } else if ('object' === typeof attributeObj && null !== attributeObj) {
        let newParentKey = parentKey;

        if (attributeObj.hasOwnProperty('attributeName')) {
            newParentKey = parentKey ? `${parentKey}${CommonConstants.NESTED_ATTRIBUTE_SEPARATOR}${attributeObj.attributeName}` : attributeObj.attributeName;
        }

        if (attributeObj.hasOwnProperty('items') && Array.isArray(attributeObj.items)) {
            attributeObj.items.forEach((item, index) => {
                extractAttributeNames(item, `${newParentKey}${CommonConstants.NESTED_ATTRIBUTE_SEPARATOR}${index}`, result);
            });
        } else if (attributeObj.hasOwnProperty('properties')) {
            Object.entries(attributeObj.properties).forEach(([key, value]) => {
                const propertyKey = `${newParentKey}${CommonConstants.NESTED_ATTRIBUTE_SEPARATOR}${key}`;
                extractAttributeNames(value, propertyKey, result);
            });
        } else {
            Object.entries(attributeObj).forEach(([key, value]) => {
                if (!['attributeName', 'items', 'properties'].includes(key)) {
                    extractAttributeNames(value, newParentKey, result);
                }
            });
        }
    } else {
        result.add(parentKey);
    }

    return Array.from(result); // Convert Set to an array and return
}

  //Merges objects inside arrays where attributes are split across multiple objects.
    function mergeArrayObjects(obj): void {   
      for (const key in obj) {
        if (Array.isArray(obj[key])) {
          // Create a map to store merged objects
          const mergedArray = [];
    
          obj[key].forEach((item) => {
            if ('object' === typeof item && null !== item) {
              Object.keys(item).forEach((k) => {
                const match = k.match(/(.*?)(\d+)$/); // Detect keys like "Course Code1"
                if (match) {
                  const baseKey = match[1].trim(); // Extract base name (e.g., "Course Code")
                  const index = parseInt(match[2]); // Extract index number (e.g., "1")
    
                  // Ensure the indexed object exists in the array
                  if (!mergedArray[index]) {
                    mergedArray[index] = {};
                  }
    
                  // Assign the correct attribute to the right indexed object
                  mergedArray[index][baseKey] = item[k];
                } else {
                  // Directly assign if no index is found
                  if (!mergedArray[0]) {
                    mergedArray[0] = {};
                  }
                  mergedArray[0][k] = item[k];
                }
              });
            }
          });
    
          obj[key] = mergedArray;
        } else if ('object' === typeof obj[key] && null !== obj[key]) {
          mergeArrayObjects(obj[key]); // Recursively merge nested objects
        }
      }
    }
    

  export function unflattenCsvRow(row: object): object {
    const result: object = {};
  
    for (const key in row) {
      if (Object.prototype.hasOwnProperty.call(row, key)) {
        const keys = TemplateIdentifier.EMAIL_COLUMN === key ? [key] : [...key.split('${CommonConstants.NESTED_ATTRIBUTE_SEPARATOR}')];
  
        let currentLevel = result;
 
        for (let i = 0; i < keys.length; i++) {
          const part = keys[i];
  
          if (i === keys.length - 1) {
            // Assign value at the last level
            if ('' !== row[key]) {
              currentLevel[part] = row[key];
            }
          } else {
            // Check if the next key is an array index
            if (!isNaN(Number(keys[i + 1]))) {
              if (!currentLevel[part]) {
                currentLevel[part] = [];
              }
              const index = parseInt(keys[i + 1]);
  
              // Ensure the indexed object exists and merge attributes
              if (!currentLevel[part][index]) {
                currentLevel[part][index] = {};
              }
  
              currentLevel = currentLevel[part][index];
              i++; // Skip the next key since it's an array index
            } else {
              // Handle object nesting
              if (!currentLevel[part]) {
                currentLevel[part] = {};
              }
              currentLevel = currentLevel[part];
            }
          }
        }
      }
    }
  
    // Merge duplicate indexed keys into a single object inside arrays
    mergeArrayObjects(result);
      return result;
  }
  