

function wallpaper( opts, onInit, onRender, onResize )
{
	this.canvas = null;
	this.context = null;
	this.fpsLabel = null;
	this.settings = {
		hideFps: true,
		targetFrameRate: 60, /* frames per second */
		estimateFrameRenderDuration: 2, /* in milliseconds */
		canvasScaling: 1
	};
	if( typeof opts === 'object' ) {
		for( var i in opts )
		{
			if( opts.hasOwnProperty(i) && this.settings.hasOwnProperty(i) ) {
				this.settings[i] = opts[i];
			}
		}
	}

	this.frameIntervalCheck = 1000/this.settings.targetFrameRate - this.settings.estimateFrameRenderDuration;

	this.onInit = onInit;
	this.onRender = onRender;
	this.onResize = onResize;

	this.init();
}

wallpaper.prototype = {
	init: function()
	{
		this.fpsLabel = document.getElementById( 'fps-label' );
		if( this.settings.hideFps && this.fpsLabel ) {
			this.fpsLabel.style.display = 'none';
		}

		this.canvas = document.getElementById('canvas');
		this.canvas.style.transformOrigin = '0 0';
		if( this.settings.canvasScaling != 1 ) {
			this.canvas.style.transform = 'scale(' + (this.settings.canvasScaling+0.01) +' )'; //adding a bit in case of rounding errors that cause white lines on edge
		}
		
		this.context = this.canvas.getContext('2d');

		this.ticks = 0;
		this.lastFrame = performance.now();
		this.fpsTimer = performance.now();

		this.refreshAll();
		
		if( this.onInit ) {
			try {
				this.onInit( this );
			}
			catch( ex ) {
				console.error( ex );
			}
		}

		var self = this;
		window.addEventListener('resize', function () { self.onWindowResize(); } );
		window.requestAnimationFrame( function() { self.animationLoop(); } );
	},
	onWindowResize: function()
	{
		this.refreshAll();
		if( this.onResize ) {
			try {
				this.onResize( this );
			}
			catch( ex ) {
				console.error( ex );
			}
		}

	},
	refreshAll: function()
	{
		this.width = this.canvas.width = window.innerWidth/this.settings.canvasScaling;
		this.height = this.canvas.height = window.innerHeight/this.settings.canvasScaling;

	},
	animationLoop: function()
	{ 
		var self = this;
		
		var now = performance.now();
		var timeStep = now - this.lastFrame;

		window.requestAnimationFrame( function() { self.animationLoop(); } );
		if( timeStep < this.frameIntervalCheck ) { // skip frame until timeStep ( in milliseconds ) has passed
			return;
		}
		this.lastFrame = now;
		this.ticks++;


		if( this.onRender ) {
			//try {
				this.onRender( this, timeStep, this.ticks );
			//}
			//catch( ex ) {
				//console.error( ex );
			//}
		}
		this.updateFps();
		
		this.renderTimeLastTime = performance.now()-now;
		this.frameIntervalCheck = 1000/this.settings.targetFrameRate - this.renderTimeLastTime - 1;

	},
	updateFps: function()
	{
		if( !this.fpsLabel ) return;
		
		var now = performance.now();
		this.frames++;
		if( now - this.fpsTimer > 1000 ) {		
			var frames = this.frames;
			this.fpsLabel.innerHTML = frames + ' fps / ' + this.renderTimeLastTime + ' ms last frame / ' + this.ticks + ' ticks';
			this.fpsTimer = now;
			this.frames = 0;
		}
	}
};
