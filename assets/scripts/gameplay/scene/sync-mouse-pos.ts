import { _decorator, Component, view } from 'cc';
import LevelManager from "../manager/level-manager";
import Character from  "../core/character";
import { ControlType } from "../scene/define";
const { ccclass } = _decorator;

@ccclass('SyncMousePos')
export default class SyncMousePos extends Component {
    update (dt: number) {
        let character = LevelManager.instance.currentCharacter;
        if (!character) return;
        let controlType = character.controlType;
        switch(controlType) {
            case ControlType.TopDown:
                let inputManager = character.linkedInputManager;
                if (!inputManager) return;
                let location = inputManager.secondaryLocation;
                let viewport = view.getViewportRect();
                let x = (location.x - viewport.width / 2) / view.getScaleX();
                let y = (location.y - viewport.height / 2) / view.getScaleY();
                this.node.setPosition(x, y);
                break;
            case ControlType.Drive:
                this.node.setPosition(999999, 999999);
                break;
            default:
                this.node.setPosition(0, 0);
                break;
        }
    }
}