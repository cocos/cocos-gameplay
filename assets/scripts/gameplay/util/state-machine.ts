import { _decorator, Node, EventTarget, log } from 'cc';
const { ccclass, property, type } = _decorator;

export class StateEventType {
    public static StateChange: string = "StateChange";
    public static StateEmpty: string = "StateEmpty";
}

export class StateEvent<T> {
    public newState: T;
    public previousState: T;
    
    public targetStateMachine: StateMachine<T>;
    public target: any;

    constructor (stateMachine: StateMachine<T>) {
        this.targetStateMachine = stateMachine;
        this.target = this.targetStateMachine.target;
        this.newState = this.targetStateMachine.currentState;
        this.previousState = this.targetStateMachine.previousState;
    }

    update () {
        this.newState = this.targetStateMachine.currentState;
        this.previousState = this.targetStateMachine.previousState;
    }
}

@ccclass('StateMachine')
export class StateMachine<T> extends EventTarget {
    public currentState: T;
    public previousState: T;
    public target: any;

    protected _stateTimeMap: Map<T, number> = new Map();
    protected _stateRouteMap: Map<T, T> = new Map();

    protected _stateCount: number = 0;
    protected _stateTime: number | undefined = undefined;
    protected _nextState: T | undefined = undefined;
    
    protected _log = false;
    public set log (value: boolean) {
        this._log = value;
    }

    protected _stateEvent: StateEvent<T> = new StateEvent(this);

    constructor (target: any, currentState: T, previousState: T, stateTime: number | undefined = undefined, nextState: T | undefined = undefined) {
        super();
        this.target = target;
        this.currentState = currentState;
        this.previousState = previousState;
        this._stateTime = stateTime;
        this._nextState = nextState;
    }

    update (dt: number) {
        if (this._stateTime == undefined) return;
        this._stateCount += dt;
        if (this._stateCount < this._stateTime) return;

        if (this._nextState != undefined) {
            if (this._nextState == this.currentState) {
                this.changeState(this.previousState);
            } else {
                this.changeState(this._nextState);
            }
        } else {
            this._stateTime = undefined;
            this._stateCount = 0;
            
            this._stateEvent.update();
            this.emit(StateEventType.StateEmpty, this._stateEvent);
        }
    }

    setStateTime (state: T, stateTime: number) {
        this._stateTimeMap.set(state, stateTime);
    }

    setStateRoute (state: T, nextState: T) {
        this._stateRouteMap.set(state, nextState);
    }

    changeState (newState: T) {
        if (newState == this.currentState) {
            return;
        }

        this.previousState = this.currentState;
        this.currentState = newState;

        this._stateTime = this._stateTimeMap.get(newState);
        this._stateCount = 0;
        this._nextState = this._stateRouteMap.get(newState);

        if (this._stateTime == 0 && this._nextState) {
            this.changeState(this._nextState);
            return;
        }

        if (this._log) {
            log("changeState", this.previousState, "=>", this.currentState);
        }

        this._stateEvent.update();
        this.emit(StateEventType.StateChange, this._stateEvent);
    }

    restorePreviousState () {
        this.currentState = this.previousState;
        this._stateEvent.update();
        this.emit(StateEventType.StateChange, this._stateEvent);   
    }

}
