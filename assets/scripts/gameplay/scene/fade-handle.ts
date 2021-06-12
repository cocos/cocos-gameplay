import { _decorator, Node, Component, Material, RenderableComponent, warn, math, lerp, renderer } from 'cc';
const { ccclass, property, type } = _decorator;

@ccclass('FadeHandle')
export default class FadeHandle extends Component {
	public static Fade: string = "Fade";
	public static Recover: string = "Recover";

	@property
	public transparent: number = 0.3;

	@property
	public fadeSpeed: number = 2;

	@property({type: [Node]})
	fadeNodes: Node[] = [];

	protected _followAlpha: number = 1;
	protected _targetAlpha: number = 1;
	protected _originAlpha: number = 1;
	protected _albedos: math.Color[] = [];
	protected _passes: renderer.Pass[] = [];
	protected _hColors: number[] = [];

	start () {
		this.node.on(FadeHandle.Fade, this.fade, this);
		this.node.on(FadeHandle.Recover, this.recover, this);

		for (let i = 0, n = this.fadeNodes.length; i < n; i++) {
			this.traverseNode(this.fadeNodes[i]);
		}
	}

	traverseNode (rootNode: Node | null) {
		if (!rootNode) return;
		this.handleMaterial(rootNode);
		let children = rootNode.children;
		for (let i = 0; i < children.length; i++) {
			this.traverseNode(children[i]);
		}
	}

	handleMaterial (node: Node) {
		if (!node) return;

		let materials: (Material | null)[] = [];
		let renderableComponent = node.getComponent(RenderableComponent);
		if (renderableComponent) {
			materials = renderableComponent.materials;
		}

		if (!materials || materials.length == 0) {
			warn("FadeHandle materials, node name is", node.name);
			return;
		}

		for (let i = 0, n = materials.length; i < n; i++) {
			if (!materials[i]) continue;
			let pass = materials[i]!.passes[0];
			this._passes.push(pass);
			let hColor = pass.getHandle("albedo");
			this._hColors.push(hColor);
			let color = new math.Color();
			this._albedos.push(color);
			pass.getUniform(hColor, color);
		}
	}

	fade (factor: number = 1.0) {
		this._targetAlpha = this.transparent * factor;
	}

	recover () {
		this._targetAlpha = this._originAlpha;
	}

	update (dt: number) {
		if ( Math.abs(this._followAlpha - this._targetAlpha) < 0.001 ) return;

		for (let i = 0; i < this._passes.length; i++) {
			this._followAlpha = lerp(this._followAlpha, this._targetAlpha, dt * this.fadeSpeed);
			this._albedos[i].a = Math.floor(this._followAlpha * 255);
			this._passes[i].setUniform(this._hColors[i], this._albedos[i]);
			this._passes[i].update();
		}
	}
}