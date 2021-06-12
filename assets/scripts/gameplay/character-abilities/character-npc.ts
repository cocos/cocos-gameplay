import { ccenum, Node, Vec3, _decorator } from 'cc';
import { GameManager } from '../manager/game-manager';
import { CharacterAbilityPriority } from '../scene/define';
const { ccclass, property, executeInEditMode } = _decorator;
import CharacterAbility from './character-ability';
import CharacterHandleWeapon from './character-handle-weapon';
import CharacterMovement from './character-movement';
import { CharacterOrientation, RotationModes } from './character-orientation';

let _tempVec3 = new Vec3;

enum MovementModes {
    Circle,
    Pingpong,
}
ccenum(MovementModes);

@ccclass('CharacterNPC')
@executeInEditMode
export default class CharacterNPC extends CharacterAbility {
	public priority: CharacterAbilityPriority = CharacterAbilityPriority.NPC;

	@property({type: [Node]})
	paths: Node[] = [];

    @property({type: MovementModes})
    movementMode: MovementModes = MovementModes.Circle;

	protected _pathIndex = 0;
	protected _currentTargetPosition: Vec3 = new Vec3;
    protected _characterMovement: CharacterMovement | null = null;
    protected _characterOrientation: CharacterOrientation | null = null;
    protected _characterHandleWeapon: CharacterHandleWeapon | null = null;
    protected _direction = 1;

    initialization () {
		super.initialization();
        this._characterMovement = this.getComponent(CharacterMovement);
        this._characterOrientation = this.getComponent(CharacterOrientation);
        if (this._characterOrientation) {
            this._characterOrientation.rotationMode = RotationModes.FollowWeapon;
        }
        this._characterHandleWeapon = this.getComponent(CharacterHandleWeapon);

        let pathNode = this.paths[this._pathIndex];
        if (pathNode) {
            pathNode.getWorldPosition(this._currentTargetPosition);
            this.node.setWorldPosition(this._currentTargetPosition);
        }
    }

    earlyProcessAbility () {
        super.earlyProcessAbility();

        this.node.getWorldPosition(_tempVec3);
        let distance = Vec3.distance(_tempVec3, this._currentTargetPosition);
        
        if (Math.abs(distance) <= this._characterMovement!.sensitivity) {
            this.next();
            let path = this.paths[this._pathIndex];
            if (path) {
                path.getWorldPosition(this._currentTargetPosition);
                if (this._characterHandleWeapon) {
                    this._characterHandleWeapon.currentTarget = path;
                }
            }
        }

        let dir = this._characterOrientation!.getCurrentForward();
        GameManager.instance.drawDirectionByPos(this.node.getPosition(), dir);
        this._characterMovement!.setMovementDirection(dir.x, dir.y, dir.z);
    }

    update () {
        // this.drawPaths();
    }

    drawPaths () {
        for (let i = 0, c = this.paths.length - 1; i < c; i++) {
            GameManager.instance.drawLine(this.paths[i], this.paths[i + 1]);
        }
    }

    next () {
        this._pathIndex += this._direction;
        let pathLength = this.paths.length;

        switch (this.movementMode) {
            case MovementModes.Pingpong:
                if (this._direction > 0 && this._pathIndex >= pathLength) {
                    this._direction = -1;
                    this._pathIndex = pathLength - 2;
                }
                if (this._direction < 0 && this._pathIndex < 0) {
                    this._direction = 1;
                    this._pathIndex = 1;
                }
            break;
            case MovementModes.Circle:
                if (this._pathIndex >= pathLength) {
                    this._pathIndex = 0;
                }
            break;
        }
    }
}