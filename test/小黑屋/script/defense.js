var Defense = {
	name: _("defense"),
	options: {}, // Nuthin'
	init: function(options) {
		this.tab = Header.addLocation(_("defense"), "defense", Defense);
		
		// Create the Outside panel
		this.panel = $('<div>').attr('id', "defensePanel")
			.addClass('location')
			.appendTo('div#locationSlider');
	},
	
	onArrival: function(transition_diff) {
		Defense.setTitle();
		if(!$SM.get('game.defense.defense')) {
			Notifications.notify(Defense, _('All of a sudden, meteorites from outer space hit the earth and spread a terrible virus, which can bring the dead back to life!'));
			//$SM.set('game.defense.defense', true);
		}
		Engine.moveStoresView($('#tower'), transition_diff);
	},
	
	setTitle: function() {
		if(Engine.activeModule == this) {
			document.title = _("defense");
		}
	}
};