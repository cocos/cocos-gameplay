import { _decorator, Node, Component, AnimationClip, animation } from 'cc';
const { ccclass, property, type, executeInEditMode } = _decorator;

@ccclass('PreviewPose')
@executeInEditMode
export default class PreviewPose extends Component {
    @property({serializable: true})
    _previewUpperBodyClip: AnimationClip | null = null;
    
    @property({type: AnimationClip})
    set previewUpperBodyClip (value: AnimationClip | null) {
        this._previewUpperBodyClip = value;
        this.updatePose();
    }

    get previewUpperBodyClip (): AnimationClip | null {
        return this._previewUpperBodyClip;
    }

    @property({serializable: true})
    _previewFullBodyClip: AnimationClip | null = null;

    @property({type: AnimationClip})
    set previewFullBodyClip (value: AnimationClip | null) {
        this._previewFullBodyClip = value;
        this.updatePose();
    }

    get previewFullBodyClip (): AnimationClip | null {
        return this._previewFullBodyClip;
    }

    @property({type: [Node]})
    upperBones: Node[] = [];

    updatePose () {
        let excludeBones:string[] | null = null;
        let includeBones:string[] | null = null;
        if (this.upperBones.length > 0) {
            includeBones = [];
            excludeBones = [];
            for (let i = 0, c = this.upperBones.length; i < c; i++) {
                let upperBone = this.upperBones[i];
                if (!upperBone) continue;
                excludeBones.push(upperBone.name);
                includeBones.push(upperBone.name);
            }
        }

        this.setPose(this._previewUpperBodyClip, null, includeBones);
        this.setPose(this._previewFullBodyClip, excludeBones, null);  
    }

    setPose (clip: AnimationClip | null, excludeBones: string[] | null = null, includeBones: string[] | null = null) {
        if (!clip) return;

        let curves = clip.curves;
        let root = this.node;
        for (let i = 0, c = curves.length; i < c; i++) {
            let curve = curves[i];
            let modifiers = curve.modifiers;
            let values = curve.data.values;
            
            let target: Node | null = null;
            let type = "";
            let path = "";
            if (modifiers.length == 2) {
                path = (modifiers[0] as any).path;
                target = (modifiers[0] as any).get(root);
                type = (modifiers[1] as string);
            } else if (modifiers.length == 1) {
                type = (modifiers[0] as string);
            }
            if (!target) {
                continue;
            }
            if (!target.active || !target.activeInHierarchy) {
                continue;
            }
            let needExclude = this.containBones(path, excludeBones);
            if (needExclude) continue;
            let hasInclude = this.containBones(path, includeBones);
            if (includeBones && includeBones.length > 0 && !hasInclude) continue;

            switch (type)  {
                case "position":
                    target.setPosition(values[0]);
                    break;
                case "scale":
                    target.setScale(values[0]);
                    break;
                case "rotation":
                    target.setRotation(values[0]);
                    break;
            }
        }
    }

    containBones (path: string, names: string[] | null) {
        if (!names || names.length == 0) return false;
        for (let i = 0, c = names.length; i < c; i++) {
            if (path.indexOf(names[i]) != -1) {
                return true;
            }
        }
        return false;
    }
}