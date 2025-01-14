import animate from './animate'
import each from '../../utils/each'
import nextUniqueId from '../../utils/next-unique-id'

export default function sequence(element, pristine = this.pristine) {
	/**
	 * We first check if the element should reset.
	 */
	if (!element.visible && element.revealed && element.config.reset) {
		return animate.call(this, element, { reset: true })
	}

	const seq = this.store.sequences[element.sequence.id]
	const i = element.sequence.index

	if (seq) {
		const visible = new SequenceModel(seq, 'visible', this.store)
		const revealed = new SequenceModel(seq, 'revealed', this.store)

		seq.models = { visible, revealed }

		/**
		 * Ensure the sequence always starts with the first element in DOM order.
		 */
		if (!revealed.body.length) {
			const firstId = seq.members[0] // Always start with the first element in the DOM
			const firstElement = this.store.elements[firstId]

			if (firstElement) {
				cue.call(this, seq, 0, +1, pristine) // Start from the first element in forward direction
				return animate.call(this, firstElement, { reveal: true, pristine })
			}
		}

		/**
		 * If our element isn’t resetting, we check the
		 * element sequence index against the head, and
		 * then the foot of the sequence.
		 */
		if (
			!seq.blocked.head &&
			i === [...revealed.head].pop() &&
			i >= [...visible.body].shift()
		) {
			cue.call(this, seq, i, -1, pristine)
			return animate.call(this, element, { reveal: true, pristine })
		}

		if (
			!seq.blocked.foot &&
			i === [...revealed.foot].shift() &&
			i <= [...visible.body].pop()
		) {
			cue.call(this, seq, i, +1, pristine)
			return animate.call(this, element, { reveal: true, pristine })
		}
	}
}

export function Sequence(interval) {
	const i = Math.abs(interval)
	if (!isNaN(i)) {
		this.id = nextUniqueId()
		this.interval = Math.max(i, 16)
		this.members = []
		this.models = {}
		this.blocked = {
			head: false,
			foot: false
		}
	} else {
		throw new RangeError('Invalid sequence interval.')
	}
}

function SequenceModel(seq, prop, store) {
	this.head = []
	this.body = []
	this.foot = []

	each(seq.members, (id, index) => {
		const element = store.elements[id]
		if (element && element[prop]) {
			this.body.push(index)
		}
	})

	if (this.body.length) {
		each(seq.members, (id, index) => {
			const element = store.elements[id]
			if (element && !element[prop]) {
				if (index < this.body[0]) {
					this.head.push(index)
				} else {
					this.foot.push(index)
				}
			}
		})
	}
}

function cue(seq, i, direction, pristine) {
	const blocked = ['head', null, 'foot'][1 + direction]
	const nextId = seq.members[i + direction]
	const nextElement = this.store.elements[nextId]

	seq.blocked[blocked] = true

	setTimeout(() => {
		seq.blocked[blocked] = false
		if (nextElement) {
			sequence.call(this, nextElement, pristine)
		}
	}, seq.interval)
}
