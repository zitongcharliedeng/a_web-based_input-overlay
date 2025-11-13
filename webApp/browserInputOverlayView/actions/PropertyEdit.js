const defaultPropertyEditProperties = {};
// Known enum values for dropdowns
const ENUM_VALUES = {
    'axis': ['X', 'Y'],
    'direction': ['positive', 'negative'],
    'type': ['left', 'right'],
    'wheel': ['up', 'down'],
    'textAlign': ['left', 'center', 'right', 'start', 'end'],
};
// Common keyboard codes for dropdown
const COMMON_KEYCODES = [
    null, 'KeyW', 'KeyA', 'KeyS', 'KeyD',
    'KeyQ', 'KeyE', 'KeyR', 'KeyF',
    'KeyZ', 'KeyX', 'KeyC', 'KeyV',
    'Space', 'ShiftLeft', 'ControlLeft',
    'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5'
];
class PropertyEdit {
    constructor() {
        this.defaultProperties = defaultPropertyEditProperties;
        this.className = "PropertyEdit";
        this.targetObject = null;
        this.targetDefaultProperties = null;
    }
    hidePropertyEdit() {
        const editorWindow = document.getElementById("propertyEditor");
        const propertyTable = document.getElementById("propertyTable");
        if (!editorWindow || !propertyTable)
            return;
        while (propertyTable.firstChild !== null) {
            propertyTable.removeChild(propertyTable.firstChild);
        }
        this.targetObject = null;
        this.targetDefaultProperties = null;
        editorWindow.hidden = true;
    }
    showPropertyEdit(defaultProperties, targetObject) {
        this.targetObject = targetObject;
        this.targetDefaultProperties = defaultProperties;
        const editorWindow = document.getElementById("propertyEditor");
        const propertyTable = document.getElementById("propertyTable");
        const editorTitle = document.getElementById("propertyEditorTitle");
        if (!editorWindow || !propertyTable || !editorTitle)
            return;
        editorTitle.innerHTML = targetObject.className || "Object";
        // Clear existing content
        while (propertyTable.firstChild !== null) {
            propertyTable.removeChild(propertyTable.firstChild);
        }
        // Recursively render all properties
        this.renderProperties(propertyTable, [], defaultProperties, targetObject);
        editorWindow.hidden = false;
    }
    renderProperties(container, path, defaultProps, targetObj) {
        for (const key in defaultProps) {
            const currentPath = [...path, key];
            const defaultValue = defaultProps[key];
            const currentValue = this.getNestedValue(targetObj, currentPath);
            const row = this.createPropertyRow(currentPath, defaultValue, currentValue, targetObj);
            container.appendChild(row);
            // If value is a plain object, recursively render its children (indented)
            if (this.isPlainObject(defaultValue)) {
                const nestedContainer = document.createElement('div');
                nestedContainer.style.marginLeft = '20px';
                this.renderProperties(nestedContainer, currentPath, defaultValue, targetObj);
                container.appendChild(nestedContainer);
            }
        }
    }
    createPropertyRow(path, defaultValue, currentValue, targetObj) {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.alignItems = 'center';
        row.style.marginBottom = '8px';
        row.style.gap = '10px';
        const label = document.createElement('label');
        label.textContent = path[path.length - 1] + ':';
        label.style.minWidth = '120px';
        label.style.color = '#FFFFFF';
        row.appendChild(label);
        const inputElement = this.createInputElement(path, defaultValue, currentValue, targetObj);
        row.appendChild(inputElement);
        return row;
    }
    createInputElement(path, defaultValue, currentValue, targetObj) {
        const pathString = path.join('.');
        const propertyName = path[path.length - 1];
        // Check if this property has enum values
        if (propertyName in ENUM_VALUES || propertyName === 'keyCode' || propertyName === 'button' || propertyName === 'index') {
            return this.createDropdown(path, propertyName, currentValue, targetObj);
        }
        const valueType = typeof defaultValue;
        switch (valueType) {
            case 'boolean':
                return this.createCheckbox(path, currentValue, targetObj);
            case 'number':
                return this.createNumberInput(path, currentValue, targetObj);
            case 'string':
                return this.createTextInput(path, currentValue, targetObj);
            case 'object':
                // For non-plain objects (Image, etc.) or null values
                if (defaultValue === null) {
                    // null can be a number or string depending on context
                    if (propertyName === 'button' || propertyName === 'index' || propertyName.includes('Axis')) {
                        return this.createNumberInput(path, currentValue, targetObj, true); // nullable number
                    }
                    return this.createTextInput(path, currentValue, targetObj, true); // nullable string
                }
                // For Image objects or other non-editable objects
                const readOnly = document.createElement('span');
                readOnly.textContent = '[Object]';
                readOnly.style.color = '#888';
                return readOnly;
            default:
                const unknown = document.createElement('span');
                unknown.textContent = String(currentValue);
                unknown.style.color = '#888';
                return unknown;
        }
    }
    createCheckbox(path, currentValue, targetObj) {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = Boolean(currentValue);
        checkbox.style.width = '20px';
        checkbox.style.height = '20px';
        checkbox.addEventListener('change', () => {
            this.setNestedValue(targetObj, path, checkbox.checked);
        });
        return checkbox;
    }
    createNumberInput(path, currentValue, targetObj, nullable = false) {
        const input = document.createElement('input');
        input.type = 'number';
        input.value = currentValue !== null ? String(currentValue) : '';
        input.placeholder = nullable ? 'null' : '';
        input.style.width = '100px';
        input.style.padding = '4px';
        input.addEventListener('input', () => {
            const value = input.value === '' && nullable ? null : Number(input.value);
            if (value !== null && !isNaN(value)) {
                this.setNestedValue(targetObj, path, value);
            }
            else if (nullable && value === null) {
                this.setNestedValue(targetObj, path, null);
            }
        });
        return input;
    }
    createTextInput(path, currentValue, targetObj, nullable = false) {
        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentValue !== null ? String(currentValue) : '';
        input.placeholder = nullable ? 'null' : '';
        input.style.width = '150px';
        input.style.padding = '4px';
        input.addEventListener('input', () => {
            const value = input.value === '' && nullable ? null : input.value;
            this.setNestedValue(targetObj, path, value);
        });
        return input;
    }
    createDropdown(path, propertyName, currentValue, targetObj) {
        const select = document.createElement('select');
        select.style.padding = '4px';
        select.style.minWidth = '120px';
        let options = [];
        // Determine which enum values to use
        if (propertyName === 'keyCode') {
            options = COMMON_KEYCODES;
        }
        else if (propertyName === 'button') {
            options = [null, 0, 1, 2, 3, 4]; // Mouse buttons
        }
        else if (propertyName === 'index') {
            options = [null, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]; // Gamepad buttons
        }
        else if (propertyName in ENUM_VALUES) {
            options = ENUM_VALUES[propertyName];
        }
        else {
            options = [null];
        }
        // Create options
        for (const optionValue of options) {
            const option = document.createElement('option');
            option.value = optionValue === null ? 'null' : String(optionValue);
            option.textContent = optionValue === null ? 'null' : String(optionValue);
            if (optionValue === currentValue) {
                option.selected = true;
            }
            select.appendChild(option);
        }
        select.addEventListener('change', () => {
            let value = select.value;
            // Convert value to appropriate type
            if (value === 'null') {
                value = null;
            }
            else if (propertyName === 'button' || propertyName === 'index') {
                value = Number(value);
            }
            // Otherwise keep as string
            this.setNestedValue(targetObj, path, value);
        });
        return select;
    }
    getNestedValue(obj, path) {
        let current = obj;
        for (const key of path) {
            if (current === null || current === undefined)
                return undefined;
            current = current[key];
        }
        return current;
    }
    setNestedValue(obj, path, value) {
        let current = obj;
        for (let i = 0; i < path.length - 1; i++) {
            if (current[path[i]] === null || current[path[i]] === undefined) {
                current[path[i]] = {};
            }
            current = current[path[i]];
        }
        current[path[path.length - 1]] = value;
    }
    isPlainObject(value) {
        if (value === null || typeof value !== 'object')
            return false;
        if (value instanceof Image || value instanceof HTMLElement)
            return false;
        if (Array.isArray(value))
            return false;
        return value.constructor === Object;
    }
    update(delta) {
    }
    draw(canvas, ctx) {
    }
}
export { PropertyEdit };
