import { _decorator, Component, Node, Vec3, Animation } from 'cc';
const { ccclass, property } = _decorator;
import Character from '../core/character';
import { InputManager } from '../manager/input-manager';
import CharacterController from '../core/character-controller';
import { StateMachine } from '../util/state-machine';
import { CharacterMovementStates, CharacterConditions, CharacterPoseStates } from '../core/character-states';
import { CharacterAnimatorBase } from '../core/character-animator-base';
import { CharacterAbilityPriority } from '../scene/define';

@ccclass('CharacterAbility')
export default class CharacterAbility extends Component {
    public priority: CharacterAbilityPriority = CharacterAbilityPriority.Any;

    protected _character: Character | null = null;
    protected _inputManager: InputManager | null = null;
    protected _controller: CharacterController | null = null;
    protected _model: Node | null = null;
    protected _animator: CharacterAnimatorBase | null = null;

    protected _movementState: StateMachine<CharacterMovementStates> | null = null;
    protected _conditionState: StateMachine<CharacterConditions> | null = null;
    protected _poseState: StateMachine<CharacterPoseStates> | null = null;

    start () {
        this._character = this.getComponent(Character);
        this._controller = this.getComponent(CharacterController);
        this._model = this._character!.model;
        this._animator = this._character!.characterAnimator;
        this._movementState = this._character!.movementState;
        this._conditionState = this._character!.conditionState;
        this._poseState = this._character!.poseState;

        this.initialization();
    }

    isNormal () {
        return this._conditionState!.currentState == CharacterConditions.Normal;
    }

    initialization () {
    }

    setInputManager (inputManager: InputManager | null) {
        this._inputManager = inputManager;
    }

    earlyProcessAbility () {
        if (this._inputManager) {
            this.handleInput();    
        }
    }

    processAbility () {
    }

    lateProcessAbility () {
    }

    handleInput () {
    }

    updateAnimator () {
    }
}
