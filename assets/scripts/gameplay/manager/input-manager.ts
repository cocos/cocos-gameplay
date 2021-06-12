import {Director, ccenum, Vec2, macro, systemEvent, SystemEventType, EventKeyboard, director, Touch, EventTouch, EventMouse, view, game } from 'cc';
import { GameManager } from './game-manager';

export enum InputType {
    None,
    KeyboardMouse,
    JoyStick,
    UI,
}
ccenum(InputType);

let _tempVec2 = new Vec2;

export class InputManager {
	public primaryMovement: Vec2 = new Vec2;
	public secondaryMovement: Vec2 = new Vec2;
    public secondaryLocation: Vec2 = new Vec2;
    public scroll: Vec2 = new Vec2;

    public touchEnable: boolean = false;
	public shootEnable: boolean = false;
    public accEnable: boolean = false;
    public crouchEnable: boolean = false;
    public accTimes = 0;
    public primaryEnable: boolean = false;
    public switchWeapon: boolean = false;
    public jumpEnable: boolean = false;

    static keyboardMouseInput: KeyboardMouseInput | null = null;
    static joyStickInput: JoyStickInput | null = null;
    static uiInput: UIInput | null = null;

    constructor () {
        director.on(Director.EVENT_AFTER_UPDATE, this.onAfterUpdate, this);
    }

    static getInputByType (type: InputType): InputManager {

        if (!InputManager.keyboardMouseInput) InputManager.keyboardMouseInput = new KeyboardMouseInput;
        if (!InputManager.keyboardMouseInput) InputManager.joyStickInput = new JoyStickInput;
        if (!InputManager.uiInput) InputManager.uiInput = new UIInput;

        switch(type) {
            case InputType.KeyboardMouse:
                return InputManager.keyboardMouseInput!;
            break;
            case InputType.JoyStick:
                return InputManager.joyStickInput!;
            break;
            case InputType.UI:
                return InputManager.uiInput!;
            break;
            default:
                return InputManager.keyboardMouseInput!;
            break;
        }
    }

    onAfterUpdate () {
        this.scroll.x = 0;
        this.scroll.y = 0;
        this.secondaryMovement.x = 0;
        this.secondaryMovement.y = 0;
        this.switchWeapon = false;
        this.jumpEnable = false;
    }

    setShoot (enable: boolean) {
        this.shootEnable = enable;
    }

    setTouch (enable: boolean) {
        this.touchEnable = enable;
    }

    setPrimaryMovement (x: number, y: number) {
        this.primaryMovement.x = x;
        this.primaryMovement.y = y;
        this.primaryMovement.normalize();
        this.primaryEnable = this.primaryMovement.length() > 0.0001; 
        if (this.primaryEnable) {
            this.checkAccelerateTimes();
        } else {
            this.decAccelerateTimes();
        }
    }

    setSecondaryLocation (locationX: number, locationY: number) {
        this.secondaryLocation.x = locationX;
        this.secondaryLocation.y = locationY;
    }

    setSecondaryMovement (movementX: number, movementY: number) {
        this.secondaryMovement.x = movementX;
        this.secondaryMovement.y = movementY;
    }

    addAccelerateTimes () {
        this.accTimes++;
    }

    setJump () {
        this.jumpEnable = true;
    }

    checkAccelerateTimes () {
        if (this.accTimes > 0) {
            this.accEnable = true;
        } else {
            this.accEnable = false;
        }
    }

    decAccelerateTimes () {
        if (this.accTimes > 0) {
            this.accTimes--;
        }
    }

    setScroll (scrollX: number, scrollY: number) {
        this.scroll.x = scrollX;
        this.scroll.y = scrollY;
    }

    switchWeaponType () {
        this.switchWeapon = true;
    }

    switchCrouch () {
        this.crouchEnable = !this.crouchEnable;
    }

    reset () {
        this.secondaryMovement.x = 0;
        this.secondaryMovement.y = 0;   
    }
};

export class KeyboardMouseInput extends InputManager {

    protected _originPrimaryMovement: Vec2 = new Vec2;

    protected _mouseLocation: Vec2 = new Vec2;

    protected _minX = 0;
    protected _maxX = 0;
    protected _minY = 0;
    protected _maxY = 0;
    protected _fullScreen = false;

    constructor () {
        super();
        systemEvent.on(SystemEventType.KEY_DOWN, this.onKeyDown, this);
        systemEvent.on(SystemEventType.KEY_UP, this.onKeyUp, this);

        systemEvent.on(SystemEventType.MOUSE_DOWN, this.onMouseDown, this)
        systemEvent.on(SystemEventType.MOUSE_MOVE, this.onMouseMove, this)
        systemEvent.on(SystemEventType.MOUSE_UP, this.onMouseUp, this)   
        systemEvent.on(SystemEventType.MOUSE_WHEEL, this.onMouseWheel, this)

        let self = this;
        if (game.canvas) {
            game.canvas.onfullscreenchange = function () {
                self._fullScreen = !self._fullScreen;
            };
        }

        let viewport = view.getViewportRect();
        this._minX = 0;
        this._maxX = viewport.width;
        this._minY = 0;
        this._maxY = viewport.height;
    }

    onMouseWheel (event: EventMouse) {
        this.setScroll(event.getScrollX(), event.getScrollY());
    }

    onMouseMove (event: EventMouse) {
        this._mouseLocation.x += event.movementX;
        this._mouseLocation.y -= event.movementY;

        if (!this._fullScreen) {
            event.getLocation(this._mouseLocation);
        }

        if (this._mouseLocation.x < this._minX) {
            this._mouseLocation.x = this._minX;
        }
        if (this._mouseLocation.x > this._maxX) {
            this._mouseLocation.x = this._maxX;
        }
        if (this._mouseLocation.y < this._minY) {
            this._mouseLocation.y = this._minY;
        }
        if (this._mouseLocation.y > this._maxY) {
            this._mouseLocation.y = this._maxY;
        }
        this.setSecondaryLocation(this._mouseLocation.x, this._mouseLocation.y);
        this.setSecondaryMovement(event.movementX, event.movementY);
    }

    onMouseDown (event: EventMouse) {
        let btnType = event.getButton();
        switch (btnType) {
            case EventMouse.BUTTON_LEFT:
                this.setShoot(true);
                break;
            case EventMouse.BUTTON_RIGHT:
                this.setTouch(true);
                break;
        }
    }

    onMouseUp (event: EventMouse) {
        let btnType = event.getButton();
        switch (btnType) {
            case EventMouse.BUTTON_LEFT:
                this.setShoot(false);
                break;
            case EventMouse.BUTTON_RIGHT:
                this.setTouch(false);
                break;
        }
    }

    onKeyDown (event: EventKeyboard) {
        switch (event.keyCode) {
            case macro.KEY.left:
            case macro.KEY.a:
                this._originPrimaryMovement.x = -1;
                break;
            case macro.KEY.right:
            case macro.KEY.d:
                this._originPrimaryMovement.x = 1;
                break;
            case macro.KEY.up:
            case macro.KEY.w:
                this._originPrimaryMovement.y = -1;
                break;
            case macro.KEY.down:
            case macro.KEY.s:
                this._originPrimaryMovement.y = 1;
                break;
            case macro.KEY.r:
                this.switchWeaponType();
                break;
            
        }
        this.setPrimaryMovement(this._originPrimaryMovement.x, this._originPrimaryMovement.y);
    }

    onKeyUp (event: EventKeyboard) {
        switch (event.keyCode) {
            case macro.KEY.left:
            case macro.KEY.a:
            case macro.KEY.right:
            case macro.KEY.d:
                this._originPrimaryMovement.x = 0;
                break;
            case macro.KEY.up:
            case macro.KEY.w:
            case macro.KEY.down:
            case macro.KEY.s:
                this._originPrimaryMovement.y = 0;
                break;
            case macro.KEY.v:
                this.addAccelerateTimes();
                break;
            case macro.KEY.space:
                this.setJump();
                break;
            case macro.KEY.z:
                this.switchCrouch();
                break;
        }
        this.setPrimaryMovement(this._originPrimaryMovement.x, this._originPrimaryMovement.y);
    }
};

export class JoyStickInput extends InputManager {
    constructor () {
        super();
        systemEvent.on(SystemEventType.TOUCH_START, this.onTouchStart, this);
        systemEvent.on(SystemEventType.TOUCH_MOVE, this.onTouchMove, this);
        systemEvent.on(SystemEventType.TOUCH_END, this.onTouchEnd, this);
    }

    onTouchMove (touch?: Touch, event?: EventTouch) {
        this.setSecondaryLocation(event!.getLocationX(), event!.getLocationY());
        let delta = event!.getDelta();
        this.setSecondaryMovement(delta.x, delta.y);
    }

    onTouchStart () {
        this.setTouch(true);
    }

    onTouchEnd () {
        this.setTouch(false);
    }
};

export class UIInput extends InputManager {

};

export class GlobalKeyboardInput {
    public switchControl: boolean = false;
    public switchDebug: boolean = false;
    public switchAim: boolean = false;

    constructor () {
        systemEvent.on(SystemEventType.KEY_DOWN, this.onKeyDown, this);
        systemEvent.on(SystemEventType.KEY_UP, this.onKeyUp, this);
        systemEvent.on(SystemEventType.MOUSE_DOWN, this.onMouseDown, this)
        systemEvent.on(SystemEventType.MOUSE_UP, this.onMouseUp, this)   

        director.on(Director.EVENT_AFTER_UPDATE, this.onAfterUpdate, this);
    }

    onMouseDown (event: EventMouse) {
        let btnType = event.getButton();
        switch (btnType) {
            case EventMouse.BUTTON_RIGHT:
                this.switchAim = true;
                break;
        }
    }

    onMouseUp (event: EventMouse) {
        let btnType = event.getButton();
        switch (btnType) {
            case EventMouse.BUTTON_RIGHT:
                this.switchAim = false;
                break;
        }
    }

    onAfterUpdate () {
        this.switchControl = false;
        this.switchDebug = false;
    }

    onKeyDown (event: EventKeyboard) {
        switch (event.keyCode) {
            case macro.KEY.c:
                this.switchControl = true;
            break;
            case macro.KEY.q:
                this.switchDebug = true;
                break;
            case macro.KEY.t:
                this.switchAim = !this.switchAim;
                break;
        }
    }

    onKeyUp (event: EventKeyboard) {
        switch (event.keyCode) {
            case macro.KEY.x:
                GameManager.instance.setFullscreen();
                break;
        }
    }
}

let globalKeyboardInput = new GlobalKeyboardInput();
export { globalKeyboardInput };