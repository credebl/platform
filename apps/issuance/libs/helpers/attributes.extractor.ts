import { CommonConstants } from '@credebl/common/common.constant';
import { TemplateIdentifier } from '@credebl/enum/enum';

// Function for extracting attributes from nested structure
export function extractAttributeNames(
  attributeObj,
  parentKey: string = '',
  result: Set<string> = new Set(),
  inNestedArray: boolean = false // Track if we're inside a nested array
): string[] {
  if (Array.isArray(attributeObj)) {
    attributeObj.forEach((item) => {
      // For array items, pass through the nested array flag
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
      const isNestedArray = parentKey.includes(CommonConstants.NESTED_ATTRIBUTE_SEPARATOR);

      attributeObj.items.forEach((item, index) => {
        // For items in nested arrays, always use index 0
        const useIndex = isNestedArray ? 0 : index;
        extractAttributeNames(
          item,
          `${newParentKey}${CommonConstants.NESTED_ATTRIBUTE_SEPARATOR}${useIndex}`,
          result,
          true // Mark that we're now in a nested array context
        );
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

//For merging nested objects with numbered keys nto an array of objects
function mergeArrayObjects(obj): void {
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      if (Array.isArray(obj[key])) {
        // Check if the array contains objects with numbered keys
        const hasNumericKeys = obj[key].some(
          (item) => item && 'object' === typeof item && Object.keys(item).some((k) => /\d{1,10}$/.test(k))
        );

        // Only apply the merging logic if we have numeric keys that need merging
        if (hasNumericKeys) {
          const mergedArray = [];
          obj[key].forEach((item) => {
            if ('object' === typeof item && null !== item) {
              Object.keys(item).forEach((k) => {
                const match = k.match(/^([^0-9]+)(\d{1,10})$/);

                if (match) {
                  const baseKey = match[1].trim();
                  const index = parseInt(match[2]);
                  if (!mergedArray[index]) {
                    mergedArray[index] = {};
                  }
                  mergedArray[index][baseKey] = item[k];
                } else {
                  if (!mergedArray[0]) {
                    mergedArray[0] = {};
                  }
                  mergedArray[0][k] = item[k];
                }
              });
            }
          });
          obj[key] = mergedArray;
        }

        // Recursively process array items that are objects
        obj[key].forEach((item) => {
          if ('object' === typeof item && null !== item) {
            mergeArrayObjects(item);
          }
        });
      } else if ('object' === typeof obj[key] && null !== obj[key]) {
        mergeArrayObjects(obj[key]);
      }
    }
  }
}

// function to converts a flattened CSV row into a nested object.
export function unflattenCsvRow(row: object): object {
  const result: object = {};
  const groupedKeys: Record<string, string[]> = {};

  for (const key in row) {
    if (Object.prototype.hasOwnProperty.call(row, key)) {
      if (TemplateIdentifier.EMAIL_COLUMN === key) {
        result[key] = row[key];
        continue;
      }

      const keyParts = key.split(`${CommonConstants.NESTED_ATTRIBUTE_SEPARATOR}`);

      if (1 < keyParts.length && !isNaN(Number(keyParts[1]))) {
        // eslint-disable-next-line prefer-destructuring
        const arrayName = keyParts[0];
        // eslint-disable-next-line prefer-destructuring
        const arrayIndex = keyParts[1];
        const groupKey = `${arrayName}~${arrayIndex}`;
        if (!groupedKeys[groupKey]) {
          groupedKeys[groupKey] = [];
        }
        groupedKeys[groupKey].push(key);
      } else {
        let currentLevel = result;
        for (let i = 0; i < keyParts.length; i++) {
          const part = keyParts[i];
          if (i === keyParts.length - 1) {
            if ('' !== row[key]) {
              currentLevel[part] = row[key];
            }
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

  for (const grpKey in groupedKeys) {
    if (Object.prototype.hasOwnProperty.call(groupedKeys, grpKey)) {
      const [arrayName, arrayIndex] = grpKey.split('~');
      const keys = groupedKeys[grpKey];
      if (!result[arrayName]) {
        result[arrayName] = [];
      }
      const index = parseInt(arrayIndex);
      while (result[arrayName].length <= index) {
        result[arrayName].push({});
      }

      for (const key of keys) {
        if ('' !== row[key]) {
          const keyParts = key.split(`${CommonConstants.NESTED_ATTRIBUTE_SEPARATOR}`);
          const remainingParts = keyParts.slice(2);
          let currentLevel = result[arrayName][index];

          for (let i = 0; i < remainingParts.length; i++) {
            const part = remainingParts[i];
            if (i === remainingParts.length - 1) {
              currentLevel[part] = row[key];
            } else {
              if (!isNaN(Number(remainingParts[i + 1]))) {
                if (!currentLevel[part]) {
                  currentLevel[part] = [];
                }
                const nestedIndex = parseInt(remainingParts[i + 1]);
                while (currentLevel[part].length <= nestedIndex) {
                  currentLevel[part].push({});
                }
                currentLevel = currentLevel[part][nestedIndex];
                i++;
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
  }

  mergeArrayObjects(result);
  return result;
}
