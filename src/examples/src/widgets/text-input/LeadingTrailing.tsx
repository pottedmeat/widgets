import { create, tsx } from '@dojo/framework/core/vdom';
import TextInput from '@dojo/widgets/text-input';

const factory = create();

export default factory(function Basic() {
	return (
		<TextInput
			label="Input label"
			leading={() => <span>A</span>}
			trailing={() => <span>Z</span>}
		/>
	);
});
