import type { ConfigManager } from '../../modelToSaveCustomConfigurationLocally/ConfigManager.js';
import type { OmniConfig, CanvasObjectConfig } from '../../modelToSaveCustomConfigurationLocally/OmniConfig.js';

// CanvasObject interface for type safety
interface CanvasObject {
	id: string;
	className?: string;
	canvasObjectType?: string;
	positionOnCanvas: { pxFromCanvasLeft: number; pxFromCanvasTop: number };
	hitboxSize: { widthInPx: number; lengthInPx: number };
	layerLevel: number;
	defaultProperties?: Record<string, unknown>;
	constructor: { name: string };
}

class PropertyEdit {
	className: string = "PropertyEdit";

	targetObject: CanvasObject | null = null;
	targetObjectId: string | null = null;  // Track object by ID
	configManager: ConfigManager | null = null;  // ConfigManager reference
	targetScene: OmniConfig | null = null;
	applySceneConfig: ((config: OmniConfig) => void) | null = null;
	deleteCallback: (() => void) | null = null;
	pendingChanges: Map<string, { path: string[], value: unknown }> = new Map();  // Accumulate changes until Done

	hidePropertyEdit(): void {
		const propertyTable = document.getElementById("propertyTable");
		const sceneConfigText = document.getElementById("sceneConfigText") as HTMLTextAreaElement;
		const leftPanel = document.getElementById("leftPanel");
		const unifiedEditor = document.getElementById("unifiedEditor");

		if (!propertyTable || !leftPanel) return;

		// Apply all pending property changes to ConfigManager
		if (this.configManager && this.targetObjectId && this.pendingChanges.size > 0) {
			for (const change of this.pendingChanges.values()) {
				this.configManager.updateObjectProperty(this.targetObjectId, change.path, change.value);
			}
			this.pendingChanges.clear();
		}

		// Canvas config editor: always apply current config
		// (No stale config issue anymore - config is always current via ConfigManager)
		if (sceneConfigText && !sceneConfigText.hidden && this.applySceneConfig) {
			try {
				const config = JSON.parse(sceneConfigText.value);
				this.applySceneConfig(config);
			} catch (parseError) {
				console.error('Invalid JSON in canvas config:', parseError);
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
			propertyTable.hidden = true;
		}
		if (leftPanel) {
			leftPanel.hidden = true;
		}
		// CRITICAL: Hide the unifiedEditor wrapper itself
		if (unifiedEditor) {
			unifiedEditor.hidden = true;
		}

		this.targetObject = null;
		this.targetObjectId = null;
		this.configManager = null;
		this.targetScene = null;
		this.applySceneConfig = null;
		this.pendingChanges.clear();
	}

	showPropertyEdit(config: CanvasObjectConfig, targetObject: CanvasObject, objectId: string, configManager: ConfigManager, deleteCallback?: () => void): void {
		this.targetObject = targetObject;
		this.targetObjectId = objectId;
		this.configManager = configManager;
		this.deleteCallback = deleteCallback || null;
		this.pendingChanges.clear();  // Clear any stale changes from previous edit session

		const unifiedEditor = document.getElementById("unifiedEditor");
		const propertyTable = document.getElementById("propertyTable");
		const sceneConfigText = document.getElementById("sceneConfigText") as HTMLTextAreaElement;
		const editorTitle = document.getElementById("editorTitle");
		const leftPanel = document.getElementById("leftPanel");
		const rightPanel = document.getElementById("rightPanel");

		if (!unifiedEditor || !propertyTable || !editorTitle || !leftPanel) return;

		// Show left panel with property table, hide canvas config text
		leftPanel.hidden = false;
		if (sceneConfigText) sceneConfigText.hidden = true;
		propertyTable.hidden = false;

		// Hide right panel (creation panel not needed for property edit)
		if (rightPanel) rightPanel.hidden = true;

		editorTitle.innerHTML = config.type;

		while (propertyTable.firstChild !== null) {
			propertyTable.removeChild(propertyTable.firstChild);
		}

		// Render ALL properties from config (id, type, positionOnCanvas, hitboxSize, layerLevel, + object-specific)
		this.renderProperties(propertyTable, [], config as unknown as Record<string, unknown>, targetObject as unknown as Record<string, unknown>);

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

	showCanvasConfig(config: OmniConfig, canvas: HTMLCanvasElement, applyCallback: (config: OmniConfig) => void): void {
		this.targetScene = config;
		this.applySceneConfig = applyCallback;

		const unifiedEditor = document.getElementById("unifiedEditor");
		const propertyTable = document.getElementById("propertyTable");
		const sceneConfigText = document.getElementById("sceneConfigText") as HTMLTextAreaElement;
		const editorTitle = document.getElementById("editorTitle");
		const leftPanel = document.getElementById("leftPanel");

		if (!unifiedEditor || !propertyTable || !sceneConfigText || !editorTitle || !leftPanel) return;

		// Show left panel with canvas config text, hide property table
		leftPanel.hidden = false;
		propertyTable.hidden = true;
		sceneConfigText.hidden = false;

		editorTitle.innerHTML = "Canvas Configuration";

		// Config is already serialized (from ConfigManager) - just display it
		sceneConfigText.value = JSON.stringify(config, null, 2);

		// Note: unifiedEditor visibility is managed by caller (showBothPanels)
	}

	private renderProperties(container: HTMLElement, path: string[], schema: Record<string, unknown>, targetObj: Record<string, unknown>): void {
		for (const key in schema) {
			const currentPath = [...path, key];
			const schemaValue = schema[key];
			const currentValue = this.getNestedValue(targetObj, currentPath);

			if (this.isPlainObject(schemaValue)) {
				const header = this.createPropertyHeader(key, path.length);
				container.appendChild(header);
				this.renderProperties(container, currentPath, schemaValue as Record<string, unknown>, targetObj);
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

	private createPropertyRow(label: string, currentValue: unknown, path: string[], targetObj: Record<string, unknown>, depth: number): HTMLElement {
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

	private createInput(currentValue: unknown, path: string[], targetObj: Record<string, unknown>): HTMLInputElement {
		const input = document.createElement('input');
		input.type = 'text';
		input.value = this.valueToString(currentValue);
		input.style.width = '200px';
		input.style.padding = '4px';
		input.style.fontFamily = 'monospace';

		input.addEventListener('input', () => {
			try {
				const parsed = this.parseValue(input.value);

				// Accumulate changes locally, apply on hidePropertyEdit (when user clicks Done)
				const pathKey = path.join('.');
				this.pendingChanges.set(pathKey, { path, value: parsed });
				input.style.borderColor = '';

				// Also update targetObject locally for immediate visual feedback (no config save)
				this.setNestedValue(targetObj, path, parsed);
			} catch (error) {
				console.error('[PropertyEdit] Failed to parse input:', error);
				input.style.borderColor = 'red';
			}
		});

		return input;
	}

	private valueToString(value: unknown): string {
		if (value === null) return 'null';
		if (value === undefined) return 'undefined';
		if (typeof value === 'string') return value;
		if (typeof value === 'number') return String(value);
		if (typeof value === 'boolean') return String(value);
		if (typeof value === 'object') {
			try {
				return JSON.stringify(value);
			} catch {
				return '[Object]';
			}
		}
		// Fallback for unexpected types
		return '[Unknown]';
	}

	private parseValue(str: string): unknown {
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

	private getNestedValue(obj: Record<string, unknown>, path: string[]): unknown {
		let current = obj;
		// Skip grouping headers like "Base Properties" that don't exist on the object
		const actualPath = path.filter(key => key !== "Base Properties");
		for (const key of actualPath) {
			if (current === null || current === undefined) return undefined;
			current = current[key];
		}
		return current;
	}

	private setNestedValue(obj: Record<string, unknown>, path: string[], value: unknown): void {
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

	private isPlainObject(value: unknown): boolean {
		if (value === null || typeof value !== 'object') return false;
		if (value instanceof Image || value instanceof HTMLElement) return false;
		if (Array.isArray(value)) return false;
		return value.constructor === Object;
	}

	update(): void {
	}

	draw(): void {
	}
}

export { PropertyEdit };
