const defaultPropertyEditProperties = {};
class PropertyEdit {
    constructor() {
        this.defaultProperties = defaultPropertyEditProperties;
        this.className = "PropertyEdit";
        this.targetObject = null;
        this.targetScene = null;
        this.applySceneConfig = null;
    }
    hidePropertyEdit() {
        const editorWindow = document.getElementById("propertyEditor");
        const propertyTable = document.getElementById("propertyTable");
        const sceneConfigText = document.getElementById("sceneConfigText");
        if (!editorWindow || !propertyTable)
            return;
        if (sceneConfigText && !sceneConfigText.hidden && this.applySceneConfig) {
            try {
                const config = JSON.parse(sceneConfigText.value);
                this.applySceneConfig(config);
            }
            catch (e) {
                console.error('Invalid JSON in scene config:', e);
                alert('Invalid JSON configuration. Changes not applied.');
            }
        }
        while (propertyTable.firstChild !== null) {
            propertyTable.removeChild(propertyTable.firstChild);
        }
        if (sceneConfigText) {
            sceneConfigText.hidden = true;
            sceneConfigText.value = '';
        }
        if (propertyTable) {
            propertyTable.hidden = false;
        }
        this.targetObject = null;
        this.targetScene = null;
        this.applySceneConfig = null;
        editorWindow.hidden = true;
    }
    showPropertyEdit(defaultProperties, targetObject) {
        this.targetObject = targetObject;
        const editorWindow = document.getElementById("propertyEditor");
        const propertyTable = document.getElementById("propertyTable");
        const sceneConfigText = document.getElementById("sceneConfigText");
        const editorTitle = document.getElementById("propertyEditorTitle");
        if (!editorWindow || !propertyTable || !editorTitle)
            return;
        if (sceneConfigText)
            sceneConfigText.hidden = true;
        propertyTable.hidden = false;
        editorTitle.innerHTML = targetObject.className || "Object";
        while (propertyTable.firstChild !== null) {
            propertyTable.removeChild(propertyTable.firstChild);
        }
        this.renderProperties(propertyTable, [], defaultProperties, targetObject);
        editorWindow.hidden = false;
    }
    showSceneConfig(scene, canvas, applyCallback) {
        this.targetScene = scene;
        this.applySceneConfig = applyCallback;
        const editorWindow = document.getElementById("propertyEditor");
        const propertyTable = document.getElementById("propertyTable");
        const sceneConfigText = document.getElementById("sceneConfigText");
        const editorTitle = document.getElementById("propertyEditorTitle");
        if (!editorWindow || !propertyTable || !sceneConfigText || !editorTitle)
            return;
        propertyTable.hidden = true;
        sceneConfigText.hidden = false;
        editorTitle.innerHTML = "Scene Configuration";
        const config = this.serializeScene(scene, canvas);
        sceneConfigText.value = JSON.stringify(config, null, 2);
        editorWindow.hidden = false;
    }
    serializeScene(scene, canvas) {
        const config = {
            canvas: {
                width: canvas.width,
                height: canvas.height,
                backgroundColor: 'transparent'
            },
            objects: []
        };
        for (const obj of scene.objects) {
            const serialized = {
                type: obj.className,
                x: obj.positionOnCanvas.pxFromCanvasLeft,
                y: obj.positionOnCanvas.pxFromCanvasTop,
                width: obj.hitboxSize.widthInPx,
                height: obj.hitboxSize.lengthInPx
            };
            if (obj.input)
                serialized.input = this.serializeObject(obj.input);
            if (obj.processing)
                serialized.processing = this.serializeObject(obj.processing);
            if (obj.display)
                serialized.display = this.serializeObject(obj.display);
            if (obj.text)
                serialized.text = obj.text;
            if (obj.textStyle)
                serialized.textStyle = obj.textStyle;
            if (obj.shouldStroke !== undefined)
                serialized.shouldStroke = obj.shouldStroke;
            config.objects.push(serialized);
        }
        return config;
    }
    serializeObject(obj) {
        if (obj === null || obj === undefined)
            return obj;
        if (typeof obj !== 'object')
            return obj;
        if (obj instanceof Image) {
            return obj.src || 'https://raw.githubusercontent.com/zitongcharliedeng/a_web-based_input-overlay/refs/heads/master/webApp/browserInputOverlayView/_assets/images/KeyDefault.png';
        }
        if (Array.isArray(obj)) {
            return obj.map(item => this.serializeObject(item));
        }
        const result = {};
        for (const key in obj) {
            result[key] = this.serializeObject(obj[key]);
        }
        return result;
    }
    renderProperties(container, path, schema, targetObj) {
        for (const key in schema) {
            const currentPath = [...path, key];
            const schemaValue = schema[key];
            const currentValue = this.getNestedValue(targetObj, currentPath);
            if (this.isPlainObject(schemaValue)) {
                const header = this.createPropertyHeader(key, path.length);
                container.appendChild(header);
                this.renderProperties(container, currentPath, schemaValue, targetObj);
            }
            else {
                const row = this.createPropertyRow(key, currentValue, currentPath, targetObj, path.length);
                container.appendChild(row);
            }
        }
    }
    createPropertyHeader(label, depth) {
        const header = document.createElement('div');
        header.style.marginLeft = `${depth * 20}px`;
        header.style.marginTop = '8px';
        header.style.marginBottom = '4px';
        header.style.color = '#AAAAAA';
        header.style.fontWeight = 'bold';
        header.textContent = label + ':';
        return header;
    }
    createPropertyRow(label, currentValue, path, targetObj, depth) {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.alignItems = 'center';
        row.style.marginLeft = `${depth * 20}px`;
        row.style.marginBottom = '4px';
        row.style.gap = '10px';
        const labelElement = document.createElement('label');
        labelElement.textContent = label + ':';
        labelElement.style.minWidth = '120px';
        labelElement.style.color = '#FFFFFF';
        row.appendChild(labelElement);
        const input = this.createInput(currentValue, path, targetObj);
        row.appendChild(input);
        return row;
    }
    createInput(currentValue, path, targetObj) {
        const input = document.createElement('input');
        input.type = 'text';
        input.value = this.valueToString(currentValue);
        input.style.width = '200px';
        input.style.padding = '4px';
        input.style.fontFamily = 'monospace';
        input.addEventListener('input', () => {
            try {
                const parsed = this.parseValue(input.value);
                this.setNestedValue(targetObj, path, parsed);
                input.style.borderColor = '';
                if (typeof targetObj.syncProperties === 'function') {
                    targetObj.syncProperties();
                }
            }
            catch (e) {
                input.style.borderColor = 'red';
            }
        });
        return input;
    }
    valueToString(value) {
        if (value === null)
            return 'null';
        if (value === undefined)
            return 'undefined';
        if (typeof value === 'string')
            return value;
        if (typeof value === 'number')
            return String(value);
        if (typeof value === 'boolean')
            return String(value);
        if (typeof value === 'object')
            return JSON.stringify(value);
        return String(value);
    }
    parseValue(str) {
        if (str === 'null')
            return null;
        if (str === 'undefined')
            return undefined;
        if (str === 'true')
            return true;
        if (str === 'false')
            return false;
        if (str === '')
            return null;
        const asNumber = Number(str);
        if (!isNaN(asNumber) && str.trim() !== '')
            return asNumber;
        try {
            return JSON.parse(str);
        }
        catch {
            return str;
        }
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
