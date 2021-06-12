import {ccenum} from 'cc'

export enum ControlType {
    None,
    TopDown,
    ThirdPerson,
    ShoulderSurfing,
    FirstPerson,
    Drive,
    Debug,
    Count
}
ccenum(ControlType);

export enum BodyStateType {
    None,
	Idle,
	Left,
	Right,
	Forward,
	Backward,
	CrouchIdle,
	CrouchLeft,
	CrouchRight,
	CrouchForward,
	CrouchBackward,
	JumpBegin,
	JumpEnd,
	JumpLoop,
    Dead,
    Damage,
    Born,
}

export enum CharacterAbilityPriority {
    AI,
    NPC,
    Drive,
    Inventory,
    Pose,
    Orientation,
    Movment,
    HandleWeapon,
    Health,
    Any,
}

export enum CameraRotateType {
    None,
    ThridPerson,
    TopDown,
    FirstPersonOrShoulderSurfing,
    Drive,
}
ccenum(CameraRotateType);

export enum ColliderGroup {
    PlayerBullet = 1 << 1,
    AI = 1 << 2,
    Ground = 1 << 3,
    Wall = 1 << 4,
    Player = 1 << 5,
    TopDownAim = 1 << 6, // for top down
    PathPoint = 1 << 7,
    Corner = 1 << 8,
    NPC = 1 << 9,
    EnemyBullet = 1 << 10,
    Bevel = 1 << 11,
    All = 0xffffffff,

    ThirdPersonAim = AI | Wall | Ground | Bevel,
    AIAim = Wall | Player | Ground | Corner | Bevel,
    CameraAim = Wall | Player | Ground | Bevel,

    PathPointAim = Wall | PathPoint | Bevel,
    AIPathPointAim = Wall | Ground | Corner | PathPoint | Bevel,
    PlayerPathPointAim = Wall | Ground | Corner | PathPoint | Bevel,
}

export enum WeaponType {
    None,
    SubmachineGun,
    Pistol,
    Minigun,
    Flamethrower,
    Shotgun,
    GrenadeLauncher,
    RocketLauncher,
    Rifle,
    Bat,
    knife,
    Sword,
    Grenade,
    MolotovCocktail,
    SmokeGrendade,
    FlashGrenade,
    AssaultRifle,
    Count,
}
ccenum(WeaponType)