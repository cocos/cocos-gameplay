import { ccenum } from "cc";

// The possible character conditions
export enum CharacterConditions {
	Null,
	Born,
	Normal,
	Damage,
	Dead,
	Destroy,
}

export enum CharacterPoseStates {
    Null,
    Stand,
    Crouch,
    Sprint,
}
ccenum(CharacterPoseStates);

/// The possible Movement States the character can be in. These usually correspond to their own class, 
/// but it's not mandatory
export enum CharacterMovementStates 
{
	Null,
	Idle,
	Falling,
	Walking,
	Crouching,
	Crawling, 
	Dashing,
	Jetpacking,
	JumpBegin,
	JumpEnd,
	JumpLoop,
	Pushing,
	DoubleJumping,
    FallingDownHole
}