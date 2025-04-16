
export default {
	'^/(app|api|assets|files|private)': {
		target: 'http://127.0.0.1:8000',
		ws: true,
		router: function(req) {
			const site_name = req.headers.host.split(':')[0];
			return `http://${site_name}:8000`;
		}
	}
};
