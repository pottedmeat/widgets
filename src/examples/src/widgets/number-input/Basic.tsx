import { create, tsx } from '@dojo/framework/core/vdom';
import NumberInput from '@dojo/widgets/number-input';
import icache from '@dojo/framework/core/middleware/icache';

const factory = create({ icache });

const Example = factory(function Example({ middleware: { icache } }) {
	return (
		<virtual>
			<NumberInput
				initialValue={42}
				onValue={(value) => {
					icache.set('value', value);
				}}
			/>
			<div>The number input value is: {`${icache.get('value')}`}</div>
		</virtual>
	);
});

export default Example;
