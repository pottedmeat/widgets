import Rate from '@dojo/widgets/rate';
import i18n from '@dojo/framework/core/middleware/i18n';
import icache from '@dojo/framework/core/middleware/icache';
import { create, tsx } from '@dojo/framework/core/vdom';
import bundle from '@dojo/widgets/rate/nls/Rate';

const factory = create({ i18n, icache });

const App = factory(function({ properties, middleware: { i18n, icache } }) {
	const { get, set } = icache;
	const { format } = i18n.localize(bundle);

	return (
		<virtual>
			<Rate
				name="half"
				steps={2}
				onValue={(value) => {
					set(
						'half',
						value &&
							format('starLabels', {
								rating: value
							})
					);
				}}
			/>
			<pre>{`${get('half')}`}</pre>
		</virtual>
	);
});

export default App;
