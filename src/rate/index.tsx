import { DNode, RenderResult } from '@dojo/framework/core/interfaces';
import { create, tsx } from '@dojo/framework/core/vdom';
import focus from '@dojo/framework/core/middleware/focus';
import i18n from '@dojo/framework/core/middleware/i18n';
import { createICacheMiddleware } from '@dojo/framework/core/middleware/icache';
import Icon from '../icon';
import Radio from '../radio';
import RadioGroup from '../radio-group';
import theme from '../middleware/theme';
import * as baseCss from '../common/styles/base.m.css';
import * as iconCss from '../theme/default/icon.m.css';
import * as radioCss from '../theme/default/radio.m.css';
import * as radioGroupCss from '../theme/default/radio-group.m.css';
import * as css from '../theme/default/rate.m.css';
import bundle from './nls/Rate';

export interface MixedNumber {
	quotient: number;
	numerator: number;
	denominator: number;
}

export interface RateProperties {
	/** The name attribute for this rating group */
	name: string;
	/** The label to be displayed in the legend */
	label?: string;
	/** The id used for the radio input elements */
	widgetId?: string;
	/** The initial rating value */
	initialValue?: number;
	/** Callback fired when the rating value changes */
	onValue?: (value?: number, mixedValue?: MixedNumber) => void;
	/** The number of times each star is divided */
	steps?: number;
	/** The highest rating for this rating group */
	max?: number;
	/** Allow undefined to be chosen with repeat click or with arrows */
	allowClear?: boolean;
	/** Prevent interaction with a visual indication */
	disabled?: boolean;
	/** Prevent interaction */
	readOnly?: boolean;
}

export interface RateChildren {
	(fill: boolean, integer: number, selected?: number, over?: number): RenderResult;
}

interface RateState {
	uuid: string;
	hover: string;
	hovering: boolean;
	selectedInteger?: number;
	selectedStep?: number;
	focused: boolean;
}

const icache = createICacheMiddleware<RateState>();

function mixedNumber(integer: number, step: number, steps: number) {
	if (step === steps) {
		step = 0;
	} else {
		integer -= 1;
	}
	return { quotient: integer, numerator: step, denominator: steps };
}

const factory = create({ focus, i18n, icache, theme })
	.properties<RateProperties>()
	.children<RateChildren | undefined>();

export const Rate = factory(function Rate({
	id,
	children,
	properties,
	middleware: { focus, i18n, icache, theme }
}) {
	const { format } = i18n.localize(bundle);
	const themedCss = theme.classes(css);
	const {
		name,
		label,
		initialValue: initialNumber = undefined,
		onValue,
		max = 5,
		steps: stepsLength = 1,
		allowClear = false,
		disabled = false,
		readOnly = false
	} = properties();
	const interaction = !disabled && !readOnly;
	const initialStep = initialNumber ? Math.round((initialNumber % 1) * stepsLength) : undefined;
	const initialInteger = initialNumber ? Math.ceil(initialNumber) : undefined;
	const initialValue = initialNumber
		? `${initialInteger}-${initialStep || stepsLength}`
		: undefined;
	const character = children()[0];
	const hovering = icache.getOrSet('hovering', false);
	const selectedInteger = icache.getOrSet('selectedInteger', initialInteger);
	const selectedStep = icache.getOrSet('selectedStep', initialStep);
	const shouldFocus = hovering ? focus.shouldFocus() : icache.getOrSet('focused', false);

	const integers: number[] = [];
	const steps: number[] = [];
	for (let step = 1; step <= stepsLength; step++) {
		steps.push(step);
	}
	const options = [];
	if (allowClear) {
		integers.push(0);
		options.push({
			value: '',
			label: format('starLabels', { quotient: 0, numerator: 0, denominator: 1 })
		});
	}
	for (let integer = 1; integer <= max; integer++) {
		integers.push(integer);
		for (const step of steps) {
			options.push({
				value: `${integer}-${step}`,
				label: format('starLabels', mixedNumber(integer, step, stepsLength))
			});
		}
	}

	const _onValue = (value?: string) => {
		if (!value) {
			icache.set('selectedInteger', undefined);
			icache.set('selectedStep', undefined);
			onValue && onValue();
		} else {
			const [integer, step] = value.split('-').map((num) => +num);
			const mixed = mixedNumber(integer, step, stepsLength);
			icache.set('selectedInteger', integer);
			icache.set('selectedStep', step);
			onValue && onValue(mixed.quotient + mixed.numerator / mixed.denominator, mixed);
		}
		focus.focus();
	};

	return (
		<div
			key="radioGroupWrapper"
			classes={[
				themedCss.root,
				readOnly ? themedCss.readOnly : null,
				disabled ? themedCss.disabled : null
			]}
			onpointerenter={() => interaction && icache.set('hovering', true)}
			onpointerleave={() => interaction && icache.set('hovering', false)}
		>
			<RadioGroup
				key="radioGroup"
				initialValue={initialValue}
				label={label}
				name={name}
				onValue={_onValue}
				options={options}
				theme={theme.compose(
					radioGroupCss,
					css,
					'radioGroup'
				)}
			>
				{(name, middleware) => {
					const [hoverInteger, hoverStep] = icache
						.getOrSet('hover', '0-0')
						.split('-')
						.map((num) => +num);
					const over =
						hovering && !shouldFocus
							? hoverInteger - 1 + hoverStep / stepsLength
							: undefined;

					return (
						<div
							classes={[
								themedCss.groupWrapper,
								shouldFocus && allowClear && selectedInteger === undefined
									? themedCss.active
									: null
							]}
						>
							{integers.map((integer) => {
								const selected =
									selectedInteger !== undefined && selectedStep !== undefined
										? selectedInteger - 1 + selectedStep / stepsLength
										: undefined;

								const radios: DNode[] = [];
								steps.forEach((step) => {
									if (integer === 0 && step !== stepsLength) {
										return;
									}

									const key = integer === 0 ? '' : `${integer}-${step}`;
									const forId = `${id}-${name}-${key}`;
									const { checked } = middleware(key);
									const activeInteger =
										shouldFocus || !hovering ? selectedInteger : hoverInteger;
									const activeStep =
										shouldFocus || !hovering ? selectedStep : hoverStep;
									let fill =
										activeInteger !== undefined && integer <= activeInteger;
									const styles: Partial<CSSStyleDeclaration> = {};
									const classes: string[] = [];
									const radioClasses: string[] = [];
									if (integer > 0 && stepsLength > 1) {
										if (step > 1) {
											classes.push(themedCss.partialCharacter);
											radioClasses.push(themedCss.partialRadio);
											styles.width = `${((stepsLength - step + 1) /
												stepsLength) *
												100}%`;
											if (
												integer === activeInteger &&
												activeStep !== undefined
											) {
												fill = step <= activeStep;
											}
										}
									}

									radios.push(
										<div
											key={key}
											styles={styles}
											classes={classes}
											onpointerenter={() =>
												interaction && icache.set('hover', key)
											}
											onclick={() =>
												interaction &&
												allowClear &&
												integer === selectedInteger &&
												step === selectedStep &&
												middleware('').checked(true)
											}
										>
											<Radio
												widgetId={forId}
												key="radio"
												name={name}
												checked={checked()}
												disabled={!interaction}
												onFocus={() => icache.set('focused', true)}
												onBlur={() => icache.set('focused', false)}
												onValue={checked}
												theme={theme.compose(
													radioCss,
													css,
													'radio'
												)}
												classes={{
													'@dojo/widgets/radio': {
														root: radioClasses,
														inputWrapper: [baseCss.visuallyHidden]
													},
													'@dojo/widgets/label': {
														root: [themedCss.labelRoot]
													}
												}}
												label={
													<virtual>
														<span
															key="radioLabel"
															classes={baseCss.visuallyHidden}
														>
															{format(
																'starLabels',
																mixedNumber(
																	integer,
																	step,
																	stepsLength
																)
															)}
														</span>
														{character ? (
															character(fill, integer, selected, over)
														) : (
															<Icon
																theme={theme.compose(
																	iconCss,
																	css,
																	'icon'
																)}
																classes={{
																	'@dojo/widgets/icon': {
																		icon: [
																			fill
																				? themedCss.filled
																				: null,
																			over &&
																			Math.ceil(over) ===
																				integer
																				? themedCss.over
																				: null
																		]
																	}
																}}
																type="starIcon"
															/>
														)}
													</virtual>
												}
											/>
										</div>
									);
								});
								return (
									<div
										key={integer}
										classes={[
											themedCss.characterWrapper,
											integer === 0 ? baseCss.visuallyHidden : null,
											shouldFocus &&
											(integer === selectedInteger ||
												(!allowClear &&
													selectedInteger === undefined &&
													integer === 1))
												? themedCss.active
												: null
										]}
									>
										{radios}
									</div>
								);
							})}
						</div>
					);
				}}
			</RadioGroup>
		</div>
	);
});

export default Rate;
