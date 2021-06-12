import { Animation, AnimationClip, AnimationState, AnimCurve, IRuntimeCurve } from 'cc';

let animCurveProto = AnimCurve.prototype as any;
animCurveProto.constant = function () {
	return false;
}

let animationStateProto = AnimationState.prototype as any;

let originInitialize = animationStateProto.initialize;
animationStateProto.initialize = function (root: Node, propertyCurves?: readonly IRuntimeCurve[]) {
	(this._clip as AnimationClip).enableTrsBlending = true;
	originInitialize.call(this, root, propertyCurves);
}

animationStateProto.setMask = function (excludeContainBones: string[] | undefined, includeContainBones: string[] | undefined, excludeSingleBones: string[] | undefined) {
	this._excludeContainBones = excludeContainBones;
	this._includeContainBones = includeContainBones;
	this._excludeSingleBones = excludeSingleBones;
}

animationStateProto.useMask = function (value: boolean) {
	if (!this._excludeContainBones && !this._includeContainBones && !this._excludeSingleBones) return;
	this._useMask = value;
}

animationStateProto.isInMask = function (curveInstance: any) {
	if (!this._useMask) return false;
	if (curveInstance._inMask != undefined) return curveInstance._inMask;

	let modifiers = curveInstance._curveDetail.modifiers;
	// not mask root node
	if (modifiers.length <= 1) return false;

	let path: string = (modifiers[0].path as string);
	let inMask = false;

	let excludeContainBones = this._excludeContainBones;
	let includeContainBones = this._includeContainBones;
	let excludeSingleBones = this._excludeSingleBones;

	if (excludeContainBones && excludeContainBones.length > 0) {
		for (let k = 0, kc = excludeContainBones.length; k < kc; k++) {
			if (path.indexOf(excludeContainBones[k]) != -1) {
				inMask = true;
				break;
			}
		}
	}

	if (excludeSingleBones && excludeSingleBones.length > 0) {
		for (let k = 0, kc = excludeSingleBones.length; k < kc; k++) {
			if (path.endsWith(excludeSingleBones[k])) {
				inMask = true;
				break;
			}
		}
	}
	
	if (includeContainBones && includeContainBones.length > 0) {
		inMask = true;
		for (let k = 0, kc = includeContainBones.length; k < kc; k++) {
			if (path.indexOf(includeContainBones[k]) != -1) {
				inMask = false;						
				break;
			}
		}
	}

	curveInstance._inMask = inMask;
	return inMask;
}

let originUpdate = animationStateProto.update;
animationStateProto.update = function (dt: number) {
	let fadeBegin = (this as any)._fadeBegin;
	if (fadeBegin) {
		let dw = this._deltaWeight * dt;
		if (Math.abs(this.weight - this._targetWeight) < Math.abs(dw)) {
			this.weight = this._targetWeight;
			this._leftFadeTime = 0;	
			(this as any)._fadeBegin = false;
		} else {
			this.weight += dw;
		}
		this._leftFadeTime -= dt;
	}

	if (this.weight < 0.00001) {
		this.stop();
		return;
	}

	let beginTime = (this as any).beginTime;
	if (beginTime != undefined) {
		let endTime = (this as any).endTime;
		let pingpong = (this as any).pingpong;
		let orginSpeed = (this as any).originSpeed || this.speed;
		let scaleDt = dt * orginSpeed;

		if (this.time + scaleDt > endTime) {
			if (pingpong) {
				this.speed = orginSpeed * -1;
			} else {
				this.time = beginTime;
			}
		}

		if (pingpong && this.time - scaleDt <  beginTime) {
			this.speed = orginSpeed;
			this.time = beginTime;
		}

		if (this.time < beginTime) {
			this.time = beginTime;
		}
	}
    originUpdate.call(this, dt);
}

animationStateProto.syncProgress = function (state: AnimationState | null) {
	if (!state) return;
	let realTime = state.time - Math.floor(state.time / state.duration) * state.duration;
	let percent = realTime / state.duration;
	this.time = this.duration * percent;
}

animationStateProto.swap = function (state: AnimationState | null, currentWeight: number | null = null) {
	if (this == state || !state || !state.isPlaying) return;

	if (!this.isPlaying) {
		this.play();
	}

	let stateAny = state as any;
	// current weight may bigger than zero
	this.weight = currentWeight || stateAny.weight;
	this.setWeightTarget(stateAny._targetWeight, stateAny._leftFadeTime);
	
	this.syncProgress(stateAny);
	stateAny.setWeightTarget(0);
}

animationStateProto.setWeightTarget = function (targetWeight: number, duration: number = 0) {
	if (!this.isPlaying) {
		this.play();
	}

	if (Math.abs(this.weight - targetWeight) < 0.001 || (duration >= 0 && duration < 0.001)) {
		this.weight = targetWeight;
		this._fadeBegin = false;
		this._targetWeight = targetWeight;
		this._leftFadeTime = 0;
		return;
	}

	this._targetWeight = targetWeight;
	this._fadeBegin = true;
	this._leftFadeTime = duration;

	if (duration > 0) {
		this._deltaWeight = (this._targetWeight - this.weight) / duration;
	}
}

animationStateProto._sampleCurves = function (ratio: number) {
	this._blendStateWriterHost.weight = this.weight;
	this._blendStateWriterHost.enabled = true;

	// Before we sample, we pull values of common targets.
	for (let iCommonTarget = 0; iCommonTarget < this._commonTargetStatuses.length; ++iCommonTarget) {
		const commonTargetStatus = this._commonTargetStatuses[iCommonTarget];
		if (!commonTargetStatus) {
			continue;
		}
		commonTargetStatus.target.pull();
		commonTargetStatus.changed = false;
	}

	for (let iSamplerSharedGroup = 0, szSamplerSharedGroup = this._samplerSharedGroups.length;
		iSamplerSharedGroup < szSamplerSharedGroup; ++iSamplerSharedGroup) {
		const samplerSharedGroup = this._samplerSharedGroups[iSamplerSharedGroup];
		const sampler = samplerSharedGroup.sampler;
		const { samplerResultCache } = samplerSharedGroup;
		let index = 0;
		let lerpRequired = false;
		if (!sampler) {
			index = 0;
		} else {
			index = sampler.sample(ratio);
			if (index < 0) {
				index = ~index;
				if (index <= 0) {
					index = 0;
				} else if (index >= sampler.ratios.length) {
					index = sampler.ratios.length - 1;
				} else {
					lerpRequired = true;
					samplerResultCache.from = index - 1;
					samplerResultCache.fromRatio = sampler.ratios[samplerResultCache.from];
					samplerResultCache.to = index;
					samplerResultCache.toRatio = sampler.ratios[samplerResultCache.to];
					index = samplerResultCache.from;
				}
			}
		}

		for (let iCurveInstance = 0, szCurves = samplerSharedGroup.curves.length;
			iCurveInstance < szCurves; ++iCurveInstance) {
			const curveInstance = samplerSharedGroup.curves[iCurveInstance];
			if (this.isInMask(curveInstance)) continue;
			curveInstance.applySample(ratio, index, lerpRequired, samplerResultCache, this.weight);
			if (curveInstance.commonTargetIndex !== undefined) {
				const commonTargetStatus = this._commonTargetStatuses[curveInstance.commonTargetIndex];
				if (commonTargetStatus) {
					commonTargetStatus.changed = true;
				}
			}
		}
	}

	// After sample, we push values of common targets.
	for (let iCommonTarget = 0; iCommonTarget < this._commonTargetStatuses.length; ++iCommonTarget) {
		const commonTargetStatus = this._commonTargetStatuses[iCommonTarget];
		if (!commonTargetStatus) {
			continue;
		}
		if (commonTargetStatus.changed) {
			commonTargetStatus.target.push();
		}
	}
}

let animationProto = Animation.prototype as any;
let originCrossFade = animationProto.crossFade;
animationProto.crossFade = function (name: string, duration: number = 0.3, weight: number = 1.0) {
	let customPlay = (this as any).customPlay;
	if (customPlay) {
		let targetState = this._nameToState[name];
		if (!targetState) return;

		let currentWeight = 1.0;

		for (const stateName in this._nameToState) {
            const state = this._nameToState[stateName];
			if (state.name == name) {
				state.setWeightTarget(weight, duration);
			} else {
				if (targetState.layer == state.layer) {
					state.setWeightTarget(0, duration);
					currentWeight -= state.weight;
				}
			}
		}

		targetState.weight = currentWeight > 0 ? currentWeight : 0;

	} else {
		originCrossFade.call(this, name, duration);
	}
}

animationProto.getTotalWeight = function (layer: number, exceptNames: string[] = []) {
	let totalWeight = 0;
	for (const stateName in this._nameToState) {
		const state = this._nameToState[stateName];
		let except = exceptNames.indexOf(state.name) != -1;
		if (layer == state.layer && !except) {
			totalWeight += state.weight;
		}
	}
	return totalWeight;
}

// checkAdditiveState true mean that if state is additive mode, it won be affect
animationProto.setWeightTarget = function (layer: number, duration: number, weight: number, checkAdditiveState: boolean = false) {
	for (const stateName in this._nameToState) {
		const state = this._nameToState[stateName];
		if (checkAdditiveState) {
			checkAdditiveState = state.isAdditive;
		}
		if (state.layer == layer && !checkAdditiveState) {
			state.setWeightTarget(weight, duration);
		}
	}
}