class GraphItem {
	constructor(id, color, visible, selected, mathField, mathExpression, valuesBuffer, implicitBuffers) {
		this.id = id;
		this.color = color;
		this.visible = visible;
		this.selected = selected;
		this.mathField = mathField;
		this.mathExpression = mathExpression;
		this.valuesBuffer = valuesBuffer;
		this.implicitBuffers = implicitBuffers;
	}
}

export { GraphItem };