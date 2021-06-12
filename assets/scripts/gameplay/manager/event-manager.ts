import { EventTarget } from 'cc';

export class GameEventType {
	// camera
	public static SetTargetCharacter: string = "SetTargetCharacter";
	public static StartFollowing: string = "StartFollowing";
	public static SwitchCameraControl: string = "SwitchCameraControl";
	public static UpdateCurrentCharacter: string = "UpdateCurrentCharacter";
	public static CharacterCreate: string = "CharacterCreate";

	// switch weapon
	public static SwitchWeapon: string = "SwitchWeapon";
};

let GameEvent = new EventTarget();
export { GameEvent };