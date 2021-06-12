import { _decorator, Component, Node, Prefab, instantiate, error, CCString, Vec3 } from 'cc';
const { ccclass, property, type } = _decorator;
import Character, { CharacterTypes } from '../core/character';
import MathUtil from '../util/math-util';
import { InputType, InputManager, globalKeyboardInput } from './input-manager';
import { GameEvent, GameEventType } from './event-manager';
import CinemachineCameraManager from '../cinemachine/cinemachine-camera-manager';
import { GameManager } from './game-manager';
import { ControlType } from '../scene/define';

@ccclass('LevelManager')
export default class LevelManager extends Component {
    public static instance: LevelManager;

	@type([Prefab])
	playerPrefabs: Prefab[] = [];

    @type([InputType])
    inputTypes: InputType[] = [];

    @type([Node])
    playerSpawnPositions: Node[] = [];

	@type(Node)
	liveContainer: Node | null = null;

    @type([Prefab])
    aiPrefabs: Prefab[] = [];

    @type([Node])
    aiSpawnPositions: Node[] = [];
    aiActiveSpawnPositions: Node[] = [];

    @property
    aiMaxCount = 1;

    @property
    aiSpawnInterval: number = 2;

    @property
    aiTotalCount = 50;
    public currentAITotalCount = 0;

	// player object
    public playerCharacters: Character[] = [];

    // ai object
    public ais: Node[] = [];
    public aiCharacters: Character[] = [];
    protected _aiSpawnTime = 0;

    // others object
    public otherCharacters: Character[] = [];

    public currentCharacter: Character | null = null;
    protected _currentCharacterIndex = 0;

    public debugCharacter:  Character | null = null;

    constructor () {
        super();
        LevelManager.instance = this;

        GameEvent.on(GameEventType.CharacterCreate, this.onCharacterCreate, this);
    }

    start () {
        if (!this.liveContainer) {
            error("LevelManager:liveContainer can not be null");
            return;
        }

        for (let i = 0, c = this.aiSpawnPositions.length; i < c; i++) {
            let spawnPosition = this.aiSpawnPositions[i];
            if (spawnPosition.active) {
                this.aiActiveSpawnPositions.push(spawnPosition);
            }
        }

        let playerCount = this.playerPrefabs.length;
        for (let i = 0; i < playerCount; i++) {
            let player: Node = instantiate(this.playerPrefabs[i]);
            let spawnPosition = Vec3.ZERO;
            if (i < this.playerSpawnPositions.length) {
                spawnPosition = this.playerSpawnPositions[i].getPosition();
            }
            
            player.setPosition(spawnPosition);
            this.liveContainer.addChild(player);

            let character = player.getComponent(Character);
            if (!character) continue;
            
            character.characterType = CharacterTypes.Player;
            character.inputType = this.inputTypes[i];
            this.playerCharacters.push(character);
        }

        GameEvent.emit(GameEventType.SetTargetCharacter, this.playerCharacters);
        GameEvent.emit(GameEventType.StartFollowing);

        GameEvent.on(GameEventType.UpdateCurrentCharacter, this.updateCurrentCharacter, this);

        CinemachineCameraManager.instance.init();
    }

    onCharacterCreate (character: Character) {
        if (character.characterType == CharacterTypes.Unknow) {
            this.otherCharacters.push(character);    
        }
    }

    updateCurrentCharacter (currentCharacter: Character, controlType: ControlType) {
        this.debugCharacter?.clearInputManager();
        this.currentCharacter?.clearInputManager();

        currentCharacter.initInputManager();
        currentCharacter.controlType = controlType;

        if (controlType == ControlType.Debug) {
            this.debugCharacter = currentCharacter;
        } else {
            this.currentCharacter = currentCharacter;
        }
    }

    update (dt: number) {
        CinemachineCameraManager.instance.process(dt);
        GameManager.instance.process(dt);

        // remove useless ai
        for (let i = this.ais.length - 1; i >= 0; i--) {
            let ai = this.ais[i];
            if (!ai.isValid) {
                this.ais.splice(i, 1);
                this.aiCharacters.splice(i, 1);
            }
        }

        // spwan new ai
        if (this.ais.length < this.aiMaxCount && this.currentAITotalCount < this.aiTotalCount) {
            this._aiSpawnTime += dt;
            if (this._aiSpawnTime > this.aiSpawnInterval) {
                this._aiSpawnTime = 0;
                this.spawnAI();    
            }
        }

        // ------------------------ early -----------------------
        // early process character
        for (let i = 0, c = this.playerCharacters.length; i < c; i++) {
            let character = this.playerCharacters[i];
            character.earlyProcess(dt);
        }

        // early process ai
        for (let i = 0, c = this.aiCharacters.length; i < c; i++) {
            let character = this.aiCharacters[i];
            character.earlyProcess(dt);
        }

        // early process other character
        for (let i = 0, c = this.otherCharacters.length; i < c; i++) {
            let character = this.otherCharacters[i];
            character.earlyProcess(dt);
        }

        // ------------------------ process -----------------------

        // process ai
        for (let i = 0, c = this.aiCharacters.length; i < c; i++) {
            let character = this.aiCharacters[i];
            character.process(dt);
        }

        // process other character
        for (let i = 0, c = this.otherCharacters.length; i < c; i++) {
            let character = this.otherCharacters[i];
            character.process(dt);
        }

        // process character
        for (let i = 0, c = this.playerCharacters.length; i < c; i++) {
            let character = this.playerCharacters[i];
            character.process(dt);
        }
    }

    lateUpdate (dt: number) {
        // ------------------------ late process -----------------------
        CinemachineCameraManager.instance.lateProcess(dt);

        // late process
        for (let i = 0, c = this.playerCharacters.length; i < c; i++) {
            let character = this.playerCharacters[i];
            character.lateProcess(dt);
        }

        for (let i = 0, c = this.aiCharacters.length; i < c; i++) {
            let character = this.aiCharacters[i];
            character.lateProcess(dt);
        }

        for (let i = 0, c = this.otherCharacters.length; i < c; i++) {
            let character = this.otherCharacters[i];
            character.lateProcess(dt);
        }
    }

    spawnAI () {
        let aiPrefabIndex = MathUtil.randomInt(0, this.aiPrefabs.length - 1);
        if (aiPrefabIndex == -1) return;
        let aiSpawnIndex = MathUtil.randomInt(0, this.aiActiveSpawnPositions.length - 1);
        if (aiSpawnIndex == -1) return;

        let ai: Node = instantiate(this.aiPrefabs[aiPrefabIndex]);
        let aiCharacter = ai.getComponent(Character)
        if (!aiCharacter) return;

        aiCharacter.characterType = CharacterTypes.AI;
        let spawnPosition = this.aiActiveSpawnPositions[aiSpawnIndex].getPosition();
        ai.setPosition(spawnPosition);
        this.ais.push(ai);
        this.aiCharacters.push(aiCharacter);
        aiCharacter.setName(ai.uuid);
        this.liveContainer!.addChild(ai);

        this.currentAITotalCount++;
    }
}
