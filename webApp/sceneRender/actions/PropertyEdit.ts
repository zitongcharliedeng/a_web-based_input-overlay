import { sceneToConfig } from '../../persistentData/sceneSerializer.js';

interface PropertyEditProperties {
}

const defaultPropertyEditProperties: PropertyEditProperties = {
}

class PropertyEdit {
	defaultProperties: PropertyEditProperties = defaultPropertyEditProperties;
	className: string = "PropertyEdit";

	targetObject: unknown = null;
	targetScene: any = null;
	applySceneConfig: ((config: any) => void) | null = null;
	deleteCallback: (() => void) | null = null;

	constructor() {
	}

	hidePropertyEdit(): void {
		const propertyTable = document.getElementById("propertyTable");
		const sceneConfigText = document.getElementById("sceneConfigText") as HTMLTextAreaElement;
		const leftPanel = document.getElementById("leftPanel");

		if (!propertyTable || !leftPanel) return;

		if (sceneConfigText && !sceneConfigText.hidden && this.applySceneConfig) {
			try {
				const config = JSON.parse(sceneConfigText.value);
				try {
					this.applySceneConfig(config);
				} catch (applyError) {
					console.error('Error applying scene config:', applyError);
					alert(`Failed to apply configuration: ${applyError instanceof Error ? applyError.message : String(applyError)}`);
					return; // Don't close editor if apply fails
				}
			} catch (parseError) {
				console.error('Invalid JSON in scene config:', parseError);
				alert('Invalid JSON syntax. Please fix the configuration.');
				return; // Don't close editor if JSON is invalid
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
			propertyTable.hidden = true;  // Hide both when closing
		}

		this.targetObject = null;
		this.targetScene = null;
		this.applySceneConfig = null;
	}

	showPropertyEdit(defaultProperties: any, targetObject: any, deleteCallback?: () => void): void {
		this.targetObject = targetObject;
		this.deleteCallback = deleteCallback || null;

		const unifiedEditor = document.getElementById("unifiedEditor");
		const propertyTable = document.getElementById("propertyTable");
		const sceneConfigText = document.getElementById("sceneConfigText") as HTMLTextAreaElement;
		const editorTitle = document.getElementById("editorTitle");
		const leftPanel = document.getElementById("leftPanel");
		const rightPanel = document.getElementById("rightPanel");

		if (!unifiedEditor || !propertyTable || !editorTitle || !leftPanel) return;

		// Hide scene config text, show property table in left panel
		if (sceneConfigText) sceneConfigText.hidden = true;
		propertyTable.hidden = false;

		// Hide right panel (creation panel not needed for property edit)
		if (rightPanel) rightPanel.hidden = true;

		editorTitle.innerHTML = targetObject.className || targetObject.canvasObjectType || targetObject.constructor.name || "Object";

		while (propertyTable.firstChild !== null) {
			propertyTable.removeChild(propertyTable.firstChild);
		}

		// Combine base properties and object-specific properties into single schema
		const combinedSchema = {
			"Base Properties": {
				positionOnCanvas: {
					pxFromCanvasLeft: targetObject.positionOnCanvas.pxFromCanvasLeft,
					pxFromCanvasTop: targetObject.positionOnCanvas.pxFromCanvasTop
				},
				hitboxSize: {
					widthInPx: targetObject.hitboxSize.widthInPx,
					lengthInPx: targetObject.hitboxSize.lengthInPx
				}
			},
			...defaultProperties
		};

		// Render all properties programmatically with proper indentation
		this.renderProperties(propertyTable, [], combinedSchema, targetObject);

		// Add Delete button at the bottom
		if (this.deleteCallback) {
			const deleteRow = document.createElement('tr');
			deleteRow.className = 'property';
			const deleteCell = document.createElement('td');
			deleteCell.colSpan = 2;
			deleteCell.style.paddingTop = '20px';

			const deleteButton = document.createElement('button');
			deleteButton.textContent = 'Delete Object';
			deleteButton.style.width = '100%';
			deleteButton.style.padding = '10px';
			deleteButton.style.backgroundColor = 'rgba(120, 40, 40, 0.9)';
			deleteButton.style.color = '#cdc1c1';
			deleteButton.style.border = '1px solid #B4B4B4';
			deleteButton.style.cursor = 'pointer';
			deleteButton.style.fontFamily = 'Lucida Console';
			deleteButton.style.fontSize = '1em';

			deleteButton.addEventListener('click', () => {
				if (confirm('Delete this object?')) {
					if (this.deleteCallback) {
						this.deleteCallback();
					}
					this.hidePropertyEdit();
				}
			});

			deleteCell.appendChild(deleteButton);
			deleteRow.appendChild(deleteCell);
			propertyTable.appendChild(deleteRow);
		}

		unifiedEditor.hidden = false;
	}

	showSceneConfig(scene: any, canvas: HTMLCanvasElement, applyCallback: (config: any) => void): void {
		this.targetScene = scene;
		this.applySceneConfig = applyCallback;

		const unifiedEditor = document.getElementById("unifiedEditor");
		const propertyTable = document.getElementById("propertyTable");
		const sceneConfigText = document.getElementById("sceneConfigText") as HTMLTextAreaElement;
		const editorTitle = document.getElementById("editorTitle");
		const leftPanel = document.getElementById("leftPanel");

		if (!unifiedEditor || !propertyTable || !sceneConfigText || !editorTitle || !leftPanel) return;

		// Hide property table, show scene config text in left panel
		propertyTable.hidden = true;
		sceneConfigText.hidden = false;

		editorTitle.innerHTML = "Scene Configuration";

		const config = this.serializeScene(scene, canvas);
		sceneConfigText.value = JSON.stringify(config, null, 2);

		// Note: unifiedEditor visibility is managed by caller (showBothPanels)
	}

	public serializeScene(scene: any, canvas: HTMLCanvasElement): any {
		// Delegate to pure function
		return sceneToConfig(scene.objects, canvas);
	}

	private renderProperties(container: HTMLElement, path: string[], schema: any, targetObj: any): void {
		for (const key in schema) {
			const currentPath = [...path, key];
			const schemaValue = schema[key];
			const currentValue = this.getNestedValue(targetObj, currentPath);

			if (this.isPlainObject(schemaValue)) {
				const header = this.createPropertyHeader(key, path.length);
				container.appendChild(header);
				this.renderProperties(container, currentPath, schemaValue, targetObj);
			} else {
				const row = this.createPropertyRow(key, currentValue, currentPath, targetObj, path.length);
				container.appendChild(row);
			}
		}
	}

	private createPropertyHeader(label: string, depth: number): HTMLElement {
		const header = document.createElement('div');
		header.style.marginLeft = `${depth * 20}px`;
		header.style.marginTop = '8px';
		header.style.marginBottom = '4px';
		header.style.color = '#AAAAAA';
		header.style.fontWeight = 'bold';
		header.textContent = label + ':';
		return header;
	}

	private createPropertyRow(label: string, currentValue: any, path: string[], targetObj: any, depth: number): HTMLElement {
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

	private createInput(currentValue: any, path: string[], targetObj: any): HTMLInputElement {
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
			} catch (e) {
				input.style.borderColor = 'red';
			}
		});

		return input;
	}

	private valueToString(value: any): string {
		if (value === null) return 'null';
		if (value === undefined) return 'undefined';
		if (typeof value === 'string') return value;
		if (typeof value === 'number') return String(value);
		if (typeof value === 'boolean') return String(value);
		if (typeof value === 'object') return JSON.stringify(value);
		return String(value);
	}

	private parseValue(str: string): any {
		if (str === 'null') return null;
		if (str === 'undefined') return undefined;
		if (str === 'true') return true;
		if (str === 'false') return false;
		if (str === '') return null;

		const asNumber = Number(str);
		if (!isNaN(asNumber) && str.trim() !== '') return asNumber;

		try {
			return JSON.parse(str);
		} catch {
			return str;
		}
	}

	private getNestedValue(obj: any, path: string[]): any {
		let current = obj;
		// Skip grouping headers like "Base Properties" that don't exist on the object
		const actualPath = path.filter(key => key !== "Base Properties");
		for (const key of actualPath) {
			if (current === null || current === undefined) return undefined;
			current = current[key];
		}
		return current;
	}

	private setNestedValue(obj: any, path: string[], value: any): void {
		let current = obj;
		// Skip grouping headers like "Base Properties" that don't exist on the object
		const actualPath = path.filter(key => key !== "Base Properties");
		for (let i = 0; i < actualPath.length - 1; i++) {
			if (current[actualPath[i]] === null || current[actualPath[i]] === undefined) {
				current[actualPath[i]] = {};
			}
			current = current[actualPath[i]];
		}
		current[actualPath[actualPath.length - 1]] = value;
	}

	private isPlainObject(value: any): boolean {
		if (value === null || typeof value !== 'object') return false;
		if (value instanceof Image || value instanceof HTMLElement) return false;
		if (Array.isArray(value)) return false;
		return value.constructor === Object;
	}

	update(delta: number): void {
	}

	draw(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
	}
}

export { PropertyEdit };
