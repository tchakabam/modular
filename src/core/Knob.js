import Context from './Context';
import SometimesDoer from '../util/SometimesDoer';
import Units from './Units';

const ENABLE_LOG = true;
const LOG_PROBABILITY = 0.01;

const doer = new SometimesDoer(LOG_PROBABILITY);
const defaultAudioCtx = Context.getOrCreateDefaultAudioContext();

/**
 * @class
 *
 * Knob wraps a native GainNode and feeds it with a looped buffer
 * containing only 1s on a single channel.
 *
 * Modulating the GainNode's gain param therefore allows modulating
 * a constant signal with another node's output.
 *
 * Thus we generate a control signal based on an a-rate param.
 */
class Knob {

	static get() {
		return Units;
	}

	/**
	 * @constructs
	 * @param {number} bufferSize - size of buffer connected to the GainNode
	 * @param {number} initialValue - initialValue of the GainNode's param
     * @prop {AudioParam} param - the GainNode's gain param
     * @prop {number} value - the GainNode's gain param value
     * @prop {Id} id - this knobs ID
     *
	 */
	constructor(bufferSize = 8192, initialValue = 0.0) {
		this.id_ = Context.newGuid();

		const gain = defaultAudioCtx.createGain();
		const buffer = defaultAudioCtx.createBuffer(1, bufferSize, defaultAudioCtx.sampleRate);
		const arr = buffer.getChannelData(0);
		for (let i = 0; i < arr.length; i++){
			arr[i] = 1;
		}
		const bufferSource = defaultAudioCtx.createBufferSource();
		bufferSource.channelCount = 1;
		bufferSource.channelCountMode = "explicit";
		bufferSource.buffer = buffer;
		bufferSource.loop = true;
		bufferSource.start(0);
		//bufferSource.noGC();
		bufferSource.connect(gain);

		this.min_ = 0;
		this.max_ = 255;
		this.step_ = 1;
		this.unit_ = Units.NONE;
		this.onvaluesethandler_ = null;
		this._gainNode = gain;
		this._gainNode.gain.value = initialValue;
	}

	/**
     * @method
     * @param {AudioNode | AudioParam} - native node or param that should be fed by this Knobs signal
     * @param {number} - input index of node. optional @default 0
     * @return passes through return value of AudioNode.connect (see https://developer.mozilla.org/en-US/docs/Web/API/AudioNode/connect)
     * Let this Knob drive something (any AudioNode's input or an AudioParam).
     * Natively this calls AudioNode.connect on the wrapped GainNode and therefore connects it's ouput
     * to the passed destination node or param.
     * If audioNode is an AudioParam it cancels any scheduled values and sets the params offset value to zero.
     */
	drive(audioNode, input = 0) {

		// if it's an AudioParam kind off thing we first need set it back to zero
		if (typeof audioNode.cancelScheduledValues === 'function') {
			audioNode.cancelScheduledValues(Context.currentTime);
			audioNode.value = 0.0;
		}

		if (input === 0) {
			// in case its just an AudioParam lets not mess with native signatures
			return this._gainNode.connect(audioNode);
		} else {
			return this._gainNode.connect(audioNode, 0, input);
		}
		return this;
	}

	free(audioNode, input = 0) {
		this.onvaluesethandler_ = null;
		if (input === 0) {
			this._gainNode.disconnect(audioNode);
		} else {
			this._gainNode.disconnect(audioNode, 0, input);
		}
		return this;
	}

	default(val) {
		this.value = val;
		return this;
	}

	callibrate(min, max, step, unit) {
		this.min_ = min;
		this.max_ = max;
		this.step_ = step;
		this.unit_ = unit;
		return this;
	}

	get id() {
		return this.id_;
	}

	get param() {
		return this._gainNode.gain;
	}

	set value(v) {
		if (typeof v !== 'number') {
			return;
		}
		this._gainNode.gain.value = v;
		this.onvaluesethandler_ && this.onvaluesethandler_(v);
	}

	set onvalueset(handler) {
		this.onvaluesethandler_ = handler;
	}

	get value() {
		return this._gainNode.gain.value;
	}

	get min() {
		return this.min_;
	}

	get max() {
		return this.max_;
	}

	get step() {
		return this.step_;
	}

	get unit() {
		return this.unit_;
	}

    /**
     * @method
     * @param {string} message - a log message
     * @param {boolean} always- set to true to always log
     * logs a message based on the doers probability
     */
	log(message, always) {
		if (!ENABLE_LOG) {
			return;
		}
		if (always) {
			console.log('Knob' + this.id + ' > ' + message);
		}
		doer.maybeLog('Knob' + this.id + ' > ' + message);
	}

	debug() {
		this.log('debug()', true);
		this.log('current value: ' + this.value, true);
	}
}

export default Knob;