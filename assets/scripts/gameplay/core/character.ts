import { _decorator, Component, Node, Constructor, Vec3, director, Label, warn } from 'cc';
const { ccclass, property, type } = _decorator;
import { InputManager, InputType } from '../manager/input-manager';
import CharacterAbility from '../character-abilities/character-ability';
import { StateEvent, StateEventType, StateMachine } from '../util/state-machine';
import { CharacterMovementStates, CharacterConditions, CharacterPoseStates } from './character-states';
import { CharacterAnimatorBase } from './character-animator-base';
import { ColliderGroup, ControlType } from '../scene/define'
import MathUtil from '../util/math-util';
import { GameManager } from '../manager/game-manager';
import { GameEvent, GameEventType } from '../manager/event-manager';

export enum CharacterTypes {
    Unknow,
    Player,
    AI,
};

let _tempVec3 = new Vec3;

@ccclass('Character')
export default class Character extends Component {
    protected _linkedInputManager:InputManager | null = null;
    get linkedInputManager () {
        return this._linkedInputManager;
    }

    protected _characterAbilities: CharacterAbility[] = [];

    @type(Node)
    public yawModel: Node | null = null;

    @type(Node)
    public upNode: Node | null = null;

    @property({type:Node})
    public pitchModel: Node | null = null;

    @property({type:Node})
    public rightNode: Node | null = null;

    @property({type:Node})
    public forwardNode: Node | null = null;

    @property({type:Node})
    public driveRotatorFollow: Node | null = null;

    @property({type:Node})
    public driveForward: Node | null = null;

    @property({type:Node})
    public crouchRotatorFollow: Node | null = null;

    @property({type:Node})
    public rotatorFollow: Node | null = null;

    @property({type: Node})
    public cameraTargetRotator: Node | null = null;

    @property({type: Node})
    public cameraTarget: Node | null = null;

    @property({type: Label})
    public characterName: Label | null = null;

    public characterType: CharacterTypes = CharacterTypes.Unknow;
    
    public inputType: InputType = InputType.None;

    @type(Node)
    public model: Node | null = null;

    @type(Node)
    public cameraCloseFadeNode: Node | null = null;

    @type(CharacterAnimatorBase)
    characterAnimator: CharacterAnimatorBase | null = null;

    public movementState: StateMachine<CharacterMovementStates> = 
        new StateMachine<CharacterMovementStates>(this, CharacterMovementStates.Idle, CharacterMovementStates.Null);

    public preMovementState: CharacterMovementStates = CharacterMovementStates.Null;

    public conditionState: StateMachine<CharacterConditions> = 
        new StateMachine<CharacterConditions>(this, CharacterConditions.Normal, CharacterConditions.Null);

    public poseState: StateMachine<CharacterPoseStates> = 
        new StateMachine<CharacterPoseStates>(this, CharacterPoseStates.Stand, CharacterPoseStates.Null);

    protected _controlType: ControlType = ControlType.None;
    public set controlType (value: ControlType) {
        this._controlType = value;
    }

    public get controlType () {
        return this._controlType;
    }

    public nearPathPointMap: Map<Node, boolean> = new Map();
    public nearPathPointList: Node[] = [];

    public currentForward: Vec3 = new Vec3(0, 0, 1);
    public currentUp: Vec3 = new Vec3(0, 1, 0);
    public currentRight: Vec3 = new Vec3(1, 0, 0);

    start () {
        if (!this.characterAnimator) {
            this.characterAnimator = this.getComponent(CharacterAnimatorBase);
            this.characterAnimator?.setConditionStateMachine(this.conditionState);
            this.characterAnimator?.setMovementStateMachine(this.movementState);
        }

        this._characterAbilities = this.getComponents(CharacterAbility);
        this._characterAbilities.sort((a, b) => a.priority - b.priority);
        this.updateInputManagersInAbilities();

        if (!this.model) {
            this.model = this.node;    
        }

        if (!this.yawModel) this.yawModel = this.model;
        if (!this.pitchModel) this.pitchModel = this.model;

        if (!this.upNode) {
            this.upNode = new Node("up");
            this.upNode.parent = this.model;
            this.upNode.setPosition(new Vec3(0, 1, 0));
        }
        if (!this.rightNode) {
            this.rightNode = new Node("right");
            this.rightNode.parent = this.model;
            this.rightNode.setPosition(new Vec3(1, 0, 0));
        }
        if (!this.forwardNode) {
            this.forwardNode = new Node("forward");
            this.forwardNode.parent = this.model;
            this.forwardNode.setPosition(new Vec3(0, 0, 1));
        }

        // born to normal state
        this.conditionState.setStateRoute(CharacterConditions.Born, CharacterConditions.Normal);
        this.conditionState.setStateTime(CharacterConditions.Born, 0);

        // back to origin state
        this.conditionState.setStateRoute(CharacterConditions.Damage, CharacterConditions.Damage);
        this.conditionState.setStateTime(CharacterConditions.Damage, 0);

        // dead to destroy state
        this.conditionState.setStateRoute(CharacterConditions.Dead, CharacterConditions.Destroy);
        this.conditionState.setStateTime(CharacterConditions.Dead, 0);

        // jump begin to jump loop
        this.movementState.setStateRoute(CharacterMovementStates.JumpBegin, CharacterMovementStates.JumpLoop);
        this.movementState.setStateTime(CharacterMovementStates.JumpBegin, 0);

        // jump end to empty
        this.movementState.setStateRoute(CharacterMovementStates.JumpEnd, CharacterMovementStates.Null);
        this.movementState.setStateTime(CharacterMovementStates.JumpEnd, 0);
        
        let node = this.node;
        this.conditionState.on(StateEventType.StateChange, function (stateEvent: StateEvent<CharacterConditions>) {
            if (stateEvent.newState == CharacterConditions.Destroy) {
                node.destroy();
            }
        });

        GameEvent.emit(GameEventType.CharacterCreate, this);
    }

    isStateChanged () {
        return this.preMovementState != this.movementState.currentState;
    }

    getRandomNearPoint () {
        let endIndex = this.nearPathPointList.length - 1;
        if (endIndex > 1) endIndex = 1;
        let index = MathUtil.randomInt(0, endIndex);
        if (index < 0) return null;
        return this.nearPathPointList[0];
    }

    isNearPoint (nearPoint: Node) {
        return !!this.nearPathPointMap.get(nearPoint);
    }

    earlyProcess (dt: number) {
        if (this.linkedInputManager) {
            GameManager.instance.getFieldViewPoint(this.upNode!, this.nearPathPointList, ColliderGroup.PlayerPathPointAim, this.nearPathPointMap);

            // debug near path points
            // GameManager.instance.drawLines(this.upNode!, this.nearPathPointList);

            // if (this.nearPathPointList.length == 0) {
            //     this.upNode!.getWorldPosition(_tempVec3);
            //     warn("Character NearPathPointList is empty, pos is", _tempVec3.x, _tempVec3.y, _tempVec3.z);
            // }
        }
        
        this.conditionState.update(dt);
        this.movementState.update(dt);
        this.poseState.update(dt);

        // we process our abilities
        this.earlyProcessAbilities();
    }

    process(dt: number) {
        this.processAbilities();
    }

    lateProcess (dt: number) {
        this.lateProcessAbilities();
        this.updateAnimator();

        this.preMovementState = this.movementState.currentState;
    }

    updateAnimator () {
        if (!this.characterAnimator) return;

        this.characterAnimator.setConditionState(this.conditionState.currentState);

        for (let i = 0, n = this._characterAbilities.length; i < n; i++) {
            let ability: CharacterAbility = this._characterAbilities[i];
            if (ability.enabled) {
                ability.updateAnimator();
            }
        }

        let dt = director.getDeltaTime();
        this.characterAnimator.process(dt);
        this.characterAnimator.lateProcess(dt);
    }

    getAbility<T extends CharacterAbility> (classConstructor: Constructor<T>): T | null {
        return this.getComponent(classConstructor);
    }

    /// Calls all registered abilities' Early Process methods
    earlyProcessAbilities () {
        for (let i = 0, n = this._characterAbilities.length; i < n; i++) {
            let ability: CharacterAbility = this._characterAbilities[i];
            if (ability.enabled) {
                ability.earlyProcessAbility();
            }
        }
    }

    /// Calls all registered abilities' Process methods
    processAbilities () {
        for (let i = 0, n = this._characterAbilities.length; i < n; i++) {
            let ability: CharacterAbility = this._characterAbilities[i];
            if (ability.enabled) {
                ability.processAbility();
            }
        }
    }

    /// Calls all registered abilities' Late Process methods
    lateProcessAbilities () {
        for (let i = 0, n = this._characterAbilities.length; i < n; i++) {
            let ability: CharacterAbility = this._characterAbilities[i];
            if (ability.enabled) {
                ability.lateProcessAbility();
            }
        }
    }

    /// Gets (if it exists) the InputManager matching the Character's Player ID
    initInputManager () {
        this._linkedInputManager = InputManager.getInputByType(this.inputType);
        this.updateInputManagersInAbilities();
    }

    clearInputManager () {
        this._linkedInputManager = null;
        this.updateInputManagersInAbilities();
    }

    updateInputManagersInAbilities () {
        if (!this._characterAbilities || this._characterAbilities.length == 0) {
            return;
        }
        for (let i = 0; i < this._characterAbilities.length; i++) {
            let characterAbility = this._characterAbilities[i];
            characterAbility.setInputManager(this.linkedInputManager);
        }
    }

    setName (name: string) {
        if (this.characterName) {
            this.characterName.string = name;
        }
    }
}
