const defaultPropertyEditProperties = {};
class PropertyEdit {
    constructor(x, y, width, height, properties) {
        this.defaultProperties = defaultPropertyEditProperties;
        this.className = "PropertyEdit";
        this.targetObject = null;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
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
        editorWindow.hidden = true;
    }
    showPropertyEdit(defaultProperties, targetObject) {
        this.targetObject = targetObject;
        const editorWindow = document.getElementById("propertyEditor");
        const propertyTable = document.getElementById("propertyTable");
        const editorTitle = document.getElementById("propertyEditorTitle");
        if (!editorWindow || !propertyTable || !editorTitle)
            return;
        editorTitle.innerHTML = targetObject.className;
        let htmlString = "";
        for (const propertyName in defaultProperties) {
            let inputValue;
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
            const inputBox = inputBoxes[i];
            inputBox.oninput = (e) => {
                const target = e.currentTarget;
                const propertyName = target.classList[1];
                let inputValue;
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
    update(delta) {
    }
    draw(canvas, ctx) {
    }
}
export { PropertyEdit };
