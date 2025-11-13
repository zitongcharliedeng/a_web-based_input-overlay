import { applyProperties } from '../_helpers/applyProperties.js';

interface PropertyEditProperties {
}

const defaultPropertyEditProperties: PropertyEditProperties = {
}

class PropertyEdit {
	defaultProperties: PropertyEditProperties = defaultPropertyEditProperties;
	className: string = "PropertyEdit";

	x: number;
	y: number;
	width: number;
	height: number;

	targetObject: any = null;

	constructor(x: number, y: number, width: number, height: number, properties?: Partial<PropertyEditProperties>) {
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;

		applyProperties(this, defaultPropertyEditProperties);
		if (properties) {
			applyProperties(this, properties);
		}
	}

	hidePropertyEdit(): void {
		const editorWindow = document.getElementById("propertyEditor");
		const propertyTable = document.getElementById("propertyTable");

		if (!editorWindow || !propertyTable) return;

		while (propertyTable.firstChild !== null) {
			propertyTable.removeChild(propertyTable.firstChild);
		}

		this.targetObject = null;
		editorWindow.hidden = true;
	}

	showPropertyEdit(defaultProperties: any, targetObject: any): void {
		this.targetObject = targetObject;

		const editorWindow = document.getElementById("propertyEditor");
		const propertyTable = document.getElementById("propertyTable");
		const editorTitle = document.getElementById("propertyEditorTitle");

		if (!editorWindow || !propertyTable || !editorTitle) return;

		editorTitle.innerHTML = targetObject.className;

		let htmlString = "";
		for (const propertyName in defaultProperties) {
			let inputValue: string;
			switch (typeof defaultProperties[propertyName]) {
				case "object":
					inputValue = JSON.stringify(targetObject[propertyName]);
					break;
				default:
					inputValue = targetObject[propertyName];
			}

			htmlString += "<tr class='property'>";
			htmlString += "<td>" + propertyName + ": </td>";
			htmlString += "<td><input type='text' value='" + inputValue + "'class='inputBox " + propertyName + "'></td>";
			htmlString += "</tr>";
		}
		propertyTable.innerHTML = htmlString;

		const inputBoxes = document.getElementsByClassName("inputBox");
		for (let i = 0; i < inputBoxes.length; i++) {
			const inputBox = inputBoxes[i] as HTMLInputElement;
			inputBox.oninput = (e: Event) => {
				const target = e.currentTarget as HTMLInputElement;
				const propertyName = target.classList[1];
				let inputValue: any;

				switch (typeof defaultProperties[propertyName]) {
					case "object":
						inputValue = JSON.parse(target.value);
						break;
					case "number":
						inputValue = Number(target.value);
						break;
					case "boolean":
						inputValue = Boolean(target.value);
						break;
					default:
						inputValue = target.value;
				}
				targetObject[propertyName] = inputValue;
			};
		}

		editorWindow.hidden = false;
	}

	update(delta: number): void {
	}

	draw(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
	}
}

export { PropertyEdit };
