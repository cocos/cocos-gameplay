import { _decorator, Component, Animation, AnimationState, Vec3, AnimationClip, Node, Quat, lerp, SkeletalAnimation } from 'cc';
import "./animation-extension";
import { WeaponType, ControlType, BodyStateType } from '../scene/define';
import { WeaponStates } from '../weapons/weapon';
import { CharacterConditions, CharacterMovementStates, CharacterPoseStates as CharacterPoseStates } from '../core/character-states';
import { StateMachine } from '../util/state-machine';
const { ccclass, property, type } = _decorator;

@ccclass('CharacterAnimatorBase')
export class CharacterAnimatorBase extends Component {
	@type(Animation)
	animation: Animation | null = null;

	public speed = 0;
	public initSpeed = 0;
	public maxSpeed = 0;
	public localAngle = 0;
	public localMoveAngle = 0;
    public yawRotateSpeed = 1;

    public currentRight: Vec3 = new Vec3(1, 0, 0);
    public currentUp: Vec3 = new Vec3(0, 1, 0);
    
	protected _preWeaponType: WeaponType | null = null;
    protected _currentWeaponType: WeaponType = WeaponType.None;
    
    protected _preWeaponState: WeaponStates | null = null;
	protected _currentWeaponState: WeaponStates = WeaponStates.WeaponUnknow;

    protected _preMovementState: CharacterMovementStates | null = null;
    protected _currentMovementState: CharacterMovementStates = CharacterMovementStates.Null;

    protected _preConditionState: CharacterConditions | null = null;
    protected _currentConditionState: CharacterConditions = CharacterConditions.Null;

	protected _preControlType: ControlType | null = null;
    protected _currentControlType: ControlType = ControlType.None;

	protected _prePoseType: CharacterPoseStates | null = null;
    protected _currentPoseType: CharacterPoseStates = CharacterPoseStates.Null;

    protected _bodyStateLayer = 0;
    protected _weaponStateLayer = 1;

	protected _conditionStateMachine: StateMachine<CharacterConditions> | null = null;
	protected _movementStateMachine: StateMachine<CharacterMovementStates> | null = null;

	start () {
		if (this.animation) {
			if (this.animation instanceof SkeletalAnimation) {
				if ((this.animation as SkeletalAnimation).useBakedAnimation) {
					this.initialization();
					return;
				}
			}
			
			(this.animation as any).customPlay = true;
			this.initialization();
		}
	}

	createState (clip: AnimationClip | null, name: string | undefined = undefined, excludeBones: string[] | undefined = undefined, includeBones: string[] | undefined = undefined) {
		if (!clip || !this.animation) return null;
		name = name || clip.name;

		let state = this.animation.getState(name);
		if (!state) {
			state = this.animation.createState(clip, name);
			state.initialize(this.animation.node);
		}
		state.weight = 0;
		(state as any).layer = this._bodyStateLayer;
		if (excludeBones || includeBones) {
			(state as any).setMask(excludeBones, includeBones);
			(state as any).useMask(true);
		}
		return state;
    }

	setStateFrameRange (state: AnimationState | null, beginFrame: number, endFrame: number, totalFrame: number, pingpong: boolean = false, originSpeed: number | undefined = undefined) {
        if (!state) return;

		let totalTime = state.clip.duration;
        let beginTime = beginFrame / totalFrame * totalTime;
        let endTime = endFrame / totalFrame * totalTime;

        (state as any).beginTime = beginTime;
		(state as any).endTime = endTime;
		(state as any).pingpong = pingpong;
		(state as any).originSpeed = originSpeed;
    }

	createBodyState (clip: AnimationClip | null, excludeBones: string[] | undefined = undefined, bodyStateType: BodyStateType) {
		let state = this.createState(clip, undefined, excludeBones);
        if (state) {
            (state as any).bodyStateType = bodyStateType;
        }
        return state;
	}

    createUpBodyState (animationClip: AnimationClip | null, includeBones: string[] | undefined, clipName: string | undefined = undefined) {
        let state = this.createState(animationClip, clipName, undefined, includeBones);
        if (state) {
            (state as any).layer = this._weaponStateLayer;
            (state as any).setWeightTarget(0);
        }
        return state;
    }

	initialization () {
	}
	
	process (dt: number) {}
	lateProcess (dt: number) {}

	setWeaponType (weaponType: WeaponType) {
		this._currentWeaponType = weaponType;
	}

    setWeaponState (weaponState: WeaponStates) {
        this._currentWeaponState = weaponState;
    }

    setMovementState (movementState: CharacterMovementStates) {
        this._currentMovementState = movementState;
    }

	setPoseState (poseType: CharacterPoseStates) {
		this._currentPoseType = poseType;
	}

    setConditionState (conditionState: CharacterConditions) {
        this._currentConditionState = conditionState;
    }

    setControlType (controlType: ControlType) {
        this._currentControlType = controlType;
    }

	setConditionStateMachine (stateMachine: StateMachine<CharacterConditions>) {
		this._conditionStateMachine = stateMachine;
	}

	setMovementStateMachine (stateMachine: StateMachine<CharacterMovementStates>) {
		this._movementStateMachine = stateMachine;
	}
}