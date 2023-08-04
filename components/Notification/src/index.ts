import Notification from './index.svelte';
import type { SvelteComponent } from 'svelte';
type UncertainFunction<T = any> = () => T | void;
type NotifyPlacement = 'right-top' | 'left-top' | 'right-bottom' | 'left-bottom' | 'center';
type NotifyType = 'info' | 'warning' | 'error' | 'success';
type Extend = {
	__notify_index: number;
	__notify_placement: NotifyPlacement;
	index: number;
	show: boolean;
};
export type NotifyComponent = SvelteComponent<NotifyOptions & Extend>;
export interface NotifyOptions {
	/**
	 * Whether the notification can be closed manually
	 */
	close?: boolean;
	/**
	 * Content of Notification title
	 * which can be a html string or a svelte component
	 */
	title?: string | SvelteComponent;
	/**
	 * The emotion category of the notification
	 */
	type?: NotifyType;
	/**
	 * Where the notification appears
	 */
	placement?: NotifyPlacement;
	/**
	 * @internal
	 * The notification is mounted
	 * using this as the anchor point
	 */
	target?: Element;
	/**
	 * The callback method when the notification is closed
	 */
	onClose?: UncertainFunction;
	/**
	 * The content of the notification,
	 * which can be a html string or a svelte component
	 */
	content?: string | SvelteComponent;
	/**
	 * Whether the notification is automatically closed
	 */
	autoClose?: boolean;
	/**
	 * Notification's auto-close timing
	 * (only when `autoClose = true`) takes effect
	 */
	duration?: number;
	/**
	 * Notification is offset on the y-axis
	 */
	offset?: number;
	/**
	 * Additional class
	 */
	cls?: string;
	/**
	 * Additional attributes
	 */
	attrs?: any;
}

const defaultNotifyOptions: NotifyOptions = {
	placement: 'right-top',
	close: true,
	duration: 3000,
	autoClose: true,
	offset: 0
};

const notifyMap = {
	'right-top': [] as NotifyComponent[],
	center: [] as NotifyComponent[],
	'left-bottom': [] as NotifyComponent[],
	'right-bottom': [] as NotifyComponent[],
	'left-top': [] as NotifyComponent[]
};

const resolveNotifyOptions = (options: NotifyOptions) => {
	const evt = {
		onClose: options.onClose
	};

	const finalOptions = {
		...defaultNotifyOptions,
		...options
	};

	Reflect.deleteProperty(finalOptions, 'onClose');

	return {
		finalOptions,
		evt
	};
};

function mountNotify(options: NotifyOptions, evt: Record<string, any>) {
	const notifyArray = notifyMap[options.placement || 'right-top'];
	let index = 0;
	if (!notifyArray) {
		console.error(
			'Notify Component Options Error: ' +
				"placement =  'right-top' | 'left-top' | 'right-bottom' | 'left-bottom' | 'center'"
		);
		return;
	}

	index = notifyArray.length;
	const NotificationInst = new Notification({
		target: options.target || document.body,
		props: {
			...options,
			show: false,
			index,
			onClose: async () => {
				await unmountNotify(
					options.placement || 'right-top',
					NotificationInst as unknown as NotifyComponent,
					0
				);
				evt.onClose && evt.onClose();
			}
		}
	});
	NotificationInst.__notify_index = index;
	NotificationInst.__notify_placment = options.placement;

	NotificationInst.$set({ show: true });
	// auto close
	autoUnmountNotify(options, NotificationInst as unknown as NotifyComponent);
	// cache  NotificationInst
	notifyArray.push(NotificationInst as unknown as NotifyComponent);

	return NotificationInst;
}

async function autoUnmountNotify(options: NotifyOptions, inst: NotifyComponent) {
	if (options.autoClose) {
		await durationUnmountNotify(options.placement || 'right-top', inst, options.duration || 0);
	}
}

async function durationUnmountNotify(
	placement: NotifyPlacement,
	inst: NotifyComponent,
	duration: number
) {
	setTimeout(() => {
		unmountNotify(placement, inst, 300);
	}, duration);
}

async function unmountNotify(placement: NotifyPlacement, inst: NotifyComponent, duration: number) {
	inst.$set({ show: false });
	setTimeout(() => {
		notifyMap[placement].splice(inst.__notify_index, 1);
		updatedNotifyByIndex(placement);
		inst.$destroy();
	}, duration);
}

function updatedNotifyByIndex(placement: NotifyPlacement) {
	notifyMap[placement].forEach((inst: NotifyComponent, index) => {
		inst.$set({ index });
		inst.__notify_index = index;
	});
}

function NotifyFn(options: NotifyOptions) {
	const { finalOptions, evt } = resolveNotifyOptions(options);
	return mountNotify(finalOptions, evt);
}

NotifyFn.info = (options: NotifyOptions = {}) => {
	options.type = 'info';
	const { finalOptions, evt } = resolveNotifyOptions(options);
	return mountNotify(finalOptions, evt);
};

NotifyFn.warning = (options: NotifyOptions = {}) => {
	options.type = 'warning';
	const { finalOptions, evt } = resolveNotifyOptions(options);
	return mountNotify(finalOptions, evt);
};

NotifyFn.error = (options: NotifyOptions = {}) => {
	options.type = 'error';
	const { finalOptions, evt } = resolveNotifyOptions(options);
	return mountNotify(finalOptions, evt);
};

NotifyFn.success = (options: NotifyOptions = {}) => {
	options.type = 'success';
	const { finalOptions, evt } = resolveNotifyOptions(options);
	return mountNotify(finalOptions, evt);
};

NotifyFn.clear = async (inst: NotifyComponent) => {
	await unmountNotify(inst.__notify_placment, inst, 300);
};

NotifyFn.clearAll = () => {
	Object.keys(notifyMap).forEach((instArr) => {
		notifyMap[instArr as NotifyPlacement].forEach((inst: NotifyComponent) => {
			unmountNotify(inst.__notify_placment, inst, 0);
		});
	});
};

NotifyFn.update = async (inst: NotifyComponent, options: NotifyOptions = {}) => {
	inst.$set({ ...options });
};

export const KNotify = NotifyFn;
