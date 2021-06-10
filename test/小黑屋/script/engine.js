(function() {
	var Engine = window.Engine = {
		
		/* TODO *** MICHAEL IS A LAZY BASTARD AND DOES NOT WANT TO REFACTOR ***
		 * Here is what he should be doing:
		 * 	- All updating values (store numbers, incomes, etc...) should be objects that can register listeners to
		 * 	  value-change events. These events should be fired whenever a value (or group of values, I suppose) is updated.
		 * 	  That would be so elegant and awesome.
		 */
		SITE_URL: encodeURIComponent("https://play.google.com/store/apps/details?id=com.gmail.sonadsog2009.A_Dark_Room"),
		VERSION: 1.2,
		NEWVERSION: 1.4,
		MAX_STORE: 99999999999999,
		SAVE_DISPLAY: 30 * 1000,
		GAME_OVER: false,
		
		//object event types
		topics: {},
			
		Perks: {
			'boxer': {
				name: _('boxer'),
				desc: _('punches do more damage'),
				notify: _('learned to throw punches with purpose')
			},
			'martial artist': {
				name: _('martial artist'),
				desc: _('punches do even more damage.'),
				notify: _('learned to fight quite effectively without weapons')
			},
			'unarmed master': {
				name: _('unarmed master'),
				desc: _('punch twice as fast, and with even more force'),
				notify: _('learned to strike faster without weapons')
			},
			'barbarian': {
				name: _('barbarian'),
				desc: _('melee weapons deal more damage'),
				notify: _('learned to swing weapons with force')
			},
			'slow metabolism': {
				name: _('slow metabolism'),
				desc: _('go twice as far without eating'),
				notify: _('learned how to ignore the hunger')
			},
			'desert rat': {
				name: _('desert rat'),
				desc: _('go twice as far without drinking'),
				notify: _('learned to love the dry air')
			},
			'evasive': {
				name: _('evasive'),
				desc: _('dodge attacks more effectively'),
				notify: _("learned to be where they're not")
			},
			'precise': {
				name: _('precise'),
				desc: _('land blows more often'),
				notify: _('learned to predict their movement')
			},
			'scout': {
				name: _('scout'),
				desc: _('see farther'),
				notify: _('learned to look ahead')
			},
			'stealthy': {
				name: _('stealthy'),
				desc: _('better avoid conflict in the wild'),
				notify: _('learned how not to be seen')
			},
			'gastronome': {
				name: _('gastronome'),
				desc: _('restore more health when eating'),
				notify: _('learned to make the most of food')
			}
		},
		
		options: {
			state: null,
			debug: false,
			log: false
		},
			
		init: function(options) {
			this.options = $.extend(
				this.options,
				options
			);
			this._debug = this.options.debug;
			this._log = this.options.log;
			
			// Check for HTML5 support
			if(!Engine.browserValid()) {
				window.location = 'browserWarning.html';
			}
			
			// Check for mobile
			/*if(Engine.isMobile()) {
				window.location = 'mobileWarning.html';
			}
			*/
	
			Engine.disableSelection();
			
			if(this.options.state != null) {
				window.State = this.options.state;
			} else {
				Engine.loadGame();
			}
			
			$('<div>').attr('id', 'locationSlider').appendTo('#main');
			
			var menu = $('<div>')
				.addClass('menu')
				.appendTo('body');
			
			var versions = $('<div>')
				.addClass('versions')
				.appendTo('body');
	
			if(typeof langs != 'undefined'){
				 var selectWrap = $('<span>')
				 	.addClass('select-wrap')
				 	.appendTo(menu);
				 var select = $('<select>')
					.addClass('menuBtn')
					.append($('<option>').text(_('language.')))
					.change(Engine.switchLanguage)
					.appendTo(selectWrap);
				
				$.each(langs, function(name,display){
					$('<option>').text(display).val(name).appendTo(select)
				})
			}
			
				
			 $('<span>')
				.addClass('lightsOff menuBtn')
				.text(_('lights off.'))
				.click(Engine.turnLightsOff)
				.appendTo(menu);
			
			$('<span>')
				.addClass('menuBtn')
				.text(_('restart.'))
				.click(Engine.confirmDelete)
				.appendTo(menu);
				
			$('<span>')
				.addClass('menuBtn')
				.text(_('save.'))
				.click(Engine.exportImport)
				.appendTo(menu);
				
			$('<span>')
				.addClass('menuBtn')
				.text(_('share.'))
				.click(Engine.share)
				.appendTo(menu);
			
			if($SM.get('version') != Engine.NEWVERSION){
				$('<span>')
					.addClass('menuBtn updataSQL')
					.text('更新版本')
					.css('color','red')
					.click(Engine.updataSQL)
					.appendTo(menu);
			}
			
			$('<span>')
				.addClass('old_versions')
				.text('当前版本v' + $SM.get('version'))
				.appendTo(versions);
				
			$('<span>')
				.text(' / ')
				.appendTo(versions);
				
			$('<span>')
				.addClass('new_versions')
				.text('最新版本v' + Engine.NEWVERSION)
				.appendTo(versions);
			
			// Register keypress handlers
			$('body').off('keydown').keydown(Engine.keyDown);
			$('body').off('keyup').keyup(Engine.keyUp);
	
			// Register swipe handlers
			swipeElement = $('#outerSlider');
			swipeElement.on('swipeleft', Engine.swipeLeft);
			swipeElement.on('swiperight', Engine.swipeRight);
			swipeElement.on('swipeup', Engine.swipeUp);
			swipeElement.on('swipedown', Engine.swipeDown);
			
			//subscribe to stateUpdates
			$.Dispatch('stateUpdate').subscribe(Engine.handleStateUpdates);
	
			$SM.init();
			Notifications.init();
			Events.init();
			Room.init();
			
			if(typeof $SM.get('stores.wood') != 'undefined') {
				Outside.init();
			}
			if($SM.get('stores.compass', true) > 0) {
				Path.init();
			}
			if($SM.get('features.location.spaceShip')) {
				Ship.init();
				document.getElementById("spacePanel").style.height = "700px";
			}
			
			Engine.saveLanguage();
			Engine.travelTo(Room);
	
		},
		
		browserValid: function() {
			return location.search.indexOf('ignorebrowser=true') >= 0 || (
					typeof Storage != 'undefined' &&
					!oldIE);
		},
		
		isMobile: function() {
			return location.search.indexOf('ignorebrowser=true') < 0 &&
				/Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent);
		},
		
		saveGame: function() {
			if(typeof Storage != 'undefined' && localStorage) {
				if(Engine._saveTimer != null) {
					clearTimeout(Engine._saveTimer);
				}
				if(typeof Engine._lastNotify == 'undefined' || Date.now() - Engine._lastNotify > Engine.SAVE_DISPLAY){
					$('#saveNotify').css('opacity', 1).animate({opacity: 0}, 1000, 'linear');
					Engine._lastNotify = Date.now();
					//保存数据
				}
				localStorage.gameState = JSON.stringify(State);
			}
		},
		
		loadGame: function() {
			try {
				var savedState = JSON.parse(localStorage.gameState);
				if(savedState) {
					State = savedState;
					$SM.updateOldState();
					Engine.log("loaded save!");
				}
			} catch(e) {
				State = {};
				$SM.set('version', Engine.VERSION);
				$SM.set('newversion', Engine.NEWVERSION);
				Engine.event('progress', 'new game');
			}
		},
		
		updataSQL: function() {
			$SM.updateOldState();
			Notifications.notify(Room, _('System：当前版本v' + $SM.get('version') + ' / 最新版本v' + Engine.NEWVERSION));
			$('.old_versions').html('当前版本v' + $SM.get('version'));
			if($SM.get('version') == Engine.NEWVERSION){
				$('.updataSQL').remove();
			}
		},
		
	  exportImport: function() {
	    Events.startEvent({
			title: _('Export / Import'),
			scenes: {
				start: {
					text: [_('export or import save data, for backing up'),
					       _('or migrating computers')],
					buttons: {
						'export': {
							text: _('export'),
							onChoose: Engine.export64
						},
						'import': {
							text: _('import'),
							nextScene: {1: 'confirm'},
						},
						'cancel': {
							text: _('cancel'),
							nextScene: 'end'
						}
					}
				},
				'confirm': {
					text: [_('are you sure?'),
					       _('if the code is invalid, all data will be lost.'),
					       _('this is irreversible.')],
					buttons: {
						'yes': {
							text: _('yes'),
							nextScene: {1: 'inputImport'},
							onChoose: Engine.enableSelection
						},
						'no': {
							text: _('no'),
							nextScene: 'end'
						}
					}
				},
				'inputImport': {
					text: [_('put the save code here.')],
					textarea: '',
					buttons: {
						'okay': {
							text: _('import'),
							nextScene: 'end',
							onChoose: Engine.import64
						},
						'cancel': {
							text: _('cancel'),
							nextScene: 'end'
						}
					}
				}
			}
		});
	  },
	  
	  export64: function() {
	    Engine.saveGame();
	    var string64 = Base64.encode(localStorage.gameState);
	    string64 = string64.replace(/\s/g, '');
	    string64 = string64.replace(/\./g, '');
	    string64 = string64.replace(/\n/g, '');
	    Engine.enableSelection();
	    Events.startEvent({
	    	title: _('Export'),
	    	scenes: {
	    		start: {
	    			text: [_('save this.')],
	    			textarea: string64,
	    			buttons: {
	    				'done': {
	    					text: _('got it'),
	    					nextScene: 'end',
	    					onChoose: Engine.disableSelection
	    				},
						'download_save': {
	    					text: '下载',
	    					nextScene: 'end',
	    					onChoose: Engine.disableSelection
	    				}
	    			}
	    		}
	    	}
	    });
		function doSave(value, type, name) {
			var blob;
			if (typeof window.Blob == "function") {
				blob = new Blob([value], {type: type});
			} else {
				var BlobBuilder = window.BlobBuilder || window.MozBlobBuilder || window.WebKitBlobBuilder || window.MSBlobBuilder;
				var bb = new BlobBuilder();
				bb.append(value);
				blob = bb.getBlob(type);
			}
			var URL = window.URL || window.webkitURL;
			var bloburl = URL.createObjectURL(blob);
			var anchor = document.createElement("a");
			if ('download' in anchor) {
				anchor.style.visibility = "hidden";
				anchor.href = bloburl;
				anchor.download = name;
				document.body.appendChild(anchor);
				//var evt = document.createEvent("Event");
				//var evt = document.createEvent("UIEvents");
				var evt = document.createEvent("MouseEvents");
				evt.initEvent("click", true, true);
				//evt.initUIEvent("click", true, true, document.defaultView, 0);
				//evt.initMouseEvent("click", true, true, document.defaultView, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
				anchor.dispatchEvent(evt);
				document.body.removeChild(anchor);
				/*
				var a = document.createElement('a');
				a.href = bloburl;
				a.download = name;
				a.textContent = 'Download';
				document.body.appendChild(a);
				*/
			} else if (navigator.msSaveBlob) {
				navigator.msSaveBlob(blob, name);
			} else {
				location.href = bloburl;
			}
		}

		var savebtn = document.getElementById("download_save"),
			textout = document.getElementById("sometext");
		savebtn.onclick = function() {
			doSave(textout.value, "text/latex", "xhw.save"); 
		};
	  },
	  
	  import64: function(string64) {
		  Engine.disableSelection();
	      string64 = string64.replace(/\s/g, '');
	      string64 = string64.replace(/\./g, '');
	      string64 = string64.replace(/\n/g, '');
	      var decodedSave = Base64.decode(string64);
	      localStorage.gameState = decodedSave;
	      location.reload();
	  },
	  
		event: function(cat, act) {
			if(typeof ga === 'function') {
				ga('send', 'event', cat, act);
			}
		},
		
		confirmDelete: function() {
			Events.startEvent({
				title: _('Restart?'),
				scenes: {
					start: {
						text: [_('restart the game?')],
						buttons: {
							'yes': {
								text: _('yes'),
								nextScene: 'end',
								onChoose: Engine.deleteSave
							},
							'no': {
								text: _('no'),
								nextScene: 'end'
							}
						}
					}
				}
			});
		},
		
		deleteSave: function(noReload) {
	    	if(typeof Storage != 'undefined' && localStorage) {
	    		var prestige = Prestige.get();
	    		window.State = {};
	    		localStorage.clear();
	    		Prestige.set(prestige);
	    	}
	    	if(!noReload) {
	    		location.reload();
	    	}
		},
		
		share: function() {
			if($SM.get('version') < Engine.NEWVERSION){
				Notifications.notify(null, _('数据版本太低，请更新版本'));
			} else {
				Events.startEvent({
					title: _('Share'),
					scenes: {
						start: {
							text: [_('bring your friends.')],
							buttons: {
								'addwood': {
									text: _('添加10000木头'),
									onChoose: function() {
										if($SM.get('material') > 0) {
											$SM.add('stores.wood', 10000);
											$SM.set('material', $SM.get('material') - 1);
											Notifications.notify(null, _('开启应急物资,获得10000木头,剩余应急物资('+$SM.get('material')+')'));
										} else {
											Notifications.notify(null, _('应急物资已用完.'));
										}
									}
								},
								'addfur': {
									text:_('添加10000毛皮'),
									onChoose: function() {
										if($SM.get('material') > 0) {
											$SM.add('stores.fur', 10000);
											$SM.set('material', $SM.get('material') - 1);
											Notifications.notify(null, _('开启应急物资,获得10000毛皮,剩余应急物资('+$SM.get('material')+')'));
										} else {
											Notifications.notify(null, _('应急物资已用完.'));
										}
									}
								},
								'addmeat': {
									text: _('添加10000鲜肉'),
									onChoose: function() {
										if($SM.get('material') > 0) {
											$SM.add('stores.meat', 10000);
											$SM.set('material', $SM.get('material') - 1);
											Notifications.notify(null, _('开启应急物资,获得10000鲜肉,剩余应急物资('+$SM.get('material')+')'));
										} else {
											Notifications.notify(null, _('应急物资已用完.'));
										}
									}
								},
								'addteeth': {
									text: _('添加10000利齿'),
									onChoose: function() {
										if($SM.get('material') > 0) {
											$SM.add('stores.teeth', 10000);
											$SM.set('material', $SM.get('material') - 1);
											Notifications.notify(null, _('开启应急物资,获得10000利齿,剩余应急物资('+$SM.get('material')+')'));
										} else {
											Notifications.notify(null, _('应急物资已用完.'));
										}
									}
								},
								'addcloth': {
									text: _('添加10000布料'),
									onChoose: function() {
										if($SM.get('material') > 0) {
											$SM.add('stores.cloth', 10000);
											$SM.set('material', $SM.get('material') - 1);
											Notifications.notify(null, _('开启应急物资,获得10000布料,剩余应急物资('+$SM.get('material')+')'));
										} else {
											Notifications.notify(null, _('应急物资已用完.'));
										}
									}
								},
								'addscales': {
									text: _('添加10000鳞片'),
									onChoose: function() {
										if($SM.get('material') > 0) {
											$SM.add('stores.scales', 10000);
											$SM.set('material', $SM.get('material') - 1);
											Notifications.notify(null, _('开启应急物资,获得10000鳞片,剩余应急物资('+$SM.get('material')+')'));
										} else {
											Notifications.notify(null, _('应急物资已用完.'));
										}
									}
								},
								'addsteel': {
									text: _('添加2500钢'),
									onChoose: function() {
										if($SM.get('material') > 0) {
											$SM.add('stores.steel', 2500);
											$SM.set('material', $SM.get('material') - 1);
											Notifications.notify(null, _('开启应急物资,获得2500钢,剩余应急物资('+$SM.get('material')+')'));
										} else {
											Notifications.notify(null, _('应急物资已用完.'));
										}
									}
								},
								'addiron': {
									text: _('添加2500铁'),
									onChoose: function() {
										if($SM.get('material') > 0) {
											$SM.add('stores.iron', 2500);
											$SM.set('material', $SM.get('material') - 1);
											Notifications.notify(null, _('开启应急物资,获得2500铁,剩余应急物资('+$SM.get('material')+')'));
										} else {
											Notifications.notify(null, _('应急物资已用完.'));
										}
									}
								},
								'addcoal': {
									text: _('添加2500煤'),
									onChoose: function() {
										if($SM.get('material') > 0) {
											$SM.add('stores.coal', 2500);
											$SM.set('material', $SM.get('material') - 1);
											Notifications.notify(null, _('开启应急物资,获得2500煤,剩余应急物资('+$SM.get('material')+')'));
										} else {
											Notifications.notify(null, _('应急物资已用完.'));
										}
										
									}
								},
								'addalien': {
									text: _('添加20外星合金'),
									onChoose: function() {
										if($SM.get('material') > 0) {
											$SM.add('stores["alien alloy"]', 20);
											$SM.set('material', $SM.get('material') - 1);
											Notifications.notify(null, _('开启应急物资,获得20外星合金,剩余应急物资('+$SM.get('material')+')'));
										} else {
											Notifications.notify(null, _('应急物资已用完.'));

										}
									}
								},
								'Gift': {
									text: _('物资礼包'),
									onChoose: function() {
										let encrypt = prompt("输入礼包兑换码.获取兑换码请加群732205749");
										var decrypt = CryptoJS.AES.decrypt(encrypt, CryptoJS.enc.Utf8.parse($SM.get('aseKey')), {
											mode: CryptoJS.mode.ECB,
											padding: CryptoJS.pad.Pkcs7
										}).toString(CryptoJS.enc.Utf8);
										var decrypt = JSON.parse(decrypt);
										if(encrypt == null || encrypt == '' || encrypt == undefined || isNaN(decrypt.gift)){
											Notifications.notify(null, _('兑换码错误.'));
										} else {
											$SM.set('material', parseInt($SM.get('material')) + parseInt(decrypt.gift));
											Notifications.notify(null, _('使用兑换码获得物资礼包' + decrypt.gift + '次'));
										}						
									}
								},
								'close': {
									text: _('close'),
									nextScene: 'end'
								}
							}
						}
					}
				}, {width: '400px'});
				$("#addwood,#addfur,#addmeat,#addteeth,#addcloth,#addscales,#addcured,#addsteel,#addiron,#addcoal,#addalien").data('cooldown','3');
			}
		},
	
	 	findStylesheet: function(title) {
	 	  	for(var i=0; i<document.styleSheets.length; i++) {
	 	      	var sheet = document.styleSheets[i];
	 	      	if(sheet.title == title) {
	 	        	return sheet;
	 	      	}
	 	    }
	 	    return null;
	 	},
	
	 	isLightsOff: function() {
	 		var darkCss = Engine.findStylesheet('darkenLights');
	 		if (darkCss != null) {
	 			if (darkCss.disabled)
	 				return false;
	 			return true;
	 		}
	 		return false;
	 	},
	 	
	 	turnLightsOff: function() {
	 	  	var darkCss = Engine.findStylesheet('darkenLights');
	 	    if (darkCss == null) {
	 	      	$('head').append('<link rel="stylesheet" href="css/dark.css" type="text/css" title="darkenLights" />');
	 	      	Engine.turnLightsOff;
	 	      	$('.lightsOff').text(_('lights on.'));
	 	    }
	 	  	else if (darkCss.disabled) {
	 	    	darkCss.disabled = false;
	 	    	$('.lightsOff').text(_('lights on.'));
	 	  	}
	 	   	else {
	 	     	$("#darkenLights").attr("disabled", "disabled");
	 	     	darkCss.disabled = true;
	 	     	$('.lightsOff').text(_('lights off.'));
	 	   	}
	 	},
		
		// Gets a guid
		getGuid: function() {
			return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
			    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
			    return v.toString(16);
			});
		},
		
		activeModule: null,
		
		travelTo: function(module) {
			if(Engine.activeModule != module) {
				var currentIndex = Engine.activeModule ? $('.location').index(Engine.activeModule.panel) : 1;
				$('div.headerButton').removeClass('selected');
				module.tab.addClass('selected');
	
				var slider = $('#locationSlider');
				var stores = $('#storesContainer');
				var panelIndex = $('.location').index(module.panel);
				var diff = Math.abs(panelIndex - currentIndex);
				slider.animate({left: -(panelIndex * 700) + 'px'}, 300 * diff);
	
				if($SM.get('stores.wood') != undefined) {
				// FIXME Why does this work if there's an animation queue...?
					stores.animate({right: -(panelIndex * 700) + 'px'}, 300 * diff);
				}
				
				Engine.activeModule = module;
	
				module.onArrival(diff);
	
				if(Engine.activeModule == Room || Engine.activeModule == Path) {
					// Don't fade out the weapons if we're switching to a module
					// where we're going to keep showing them anyway.
					if (module != Room && module != Path) {
						$('div#weapons').animate({opacity: 0}, 300);
					}
				}
	
				if(module == Room || module == Path) {
					$('div#weapons').animate({opacity: 1}, 300);
				}
	
				
				
				Notifications.printQueue(module);
			}
		},
	
		// Move the stores panel beneath top_container (or to top: 0px if top_container
		// either hasn't been filled in or is null) using transition_diff to sync with
		// the animation in Engine.travelTo().
		moveStoresView: function(top_container, transition_diff) {
			var stores = $('#storesContainer');
	
			// If we don't have a storesContainer yet, leave.
			if(typeof(stores) === 'undefined') return;
	
			if(typeof(transition_diff) === 'undefined') transition_diff = 1;
	
			if(top_container === null) {
				stores.animate({top: '0px'}, {queue: false, duration: 300 * transition_diff});
			}
			else if(!top_container.length) {
				stores.animate({top: '0px'}, {queue: false, duration: 300 * transition_diff});
			}
			else {
				stores.animate({top: top_container.height() + 26 + 'px'},
							   {queue: false, duration: 300 * transition_diff});
			}
		},
		
		log: function(msg) {
			if(this._log) {
				console.log(msg);
			}
		},
		
		updateSlider: function() {
			var slider = $('#locationSlider');
			slider.width((slider.children().length * 700) + 'px');
		},
		
		updateOuterSlider: function() {
			var slider = $('#outerSlider');
			slider.width((slider.children().length * 700) + 'px');
		},
		
		getIncomeMsg: function(num, delay) {
			return _("{0} per {1}s", (num > 0 ? "+" : "") + num, delay);
			//return (num > 0 ? "+" : "") + num + " per " + delay + "s";
		},
		
		keyDown: function(e) {
			if(!Engine.keyPressed && !Engine.keyLock) {
				Engine.pressed = true;
				if(Engine.activeModule.keyDown) {
					Engine.activeModule.keyDown(e);
				}
			}
			return false;
		},
		
		keyUp: function(e) {
			Engine.pressed = false;
			if(Engine.activeModule.keyUp) {
				Engine.activeModule.keyUp(e);
			}
	        else
	        {
	            switch(e.which) {
	                case 38: // Up
	                case 87:
	                    Engine.log('up');
	                    break;
	                case 40: // Down
	                case 83:
	                    Engine.log('down');
	                    break;
	                case 37: // Left
	                case 65:
	                    if(Engine.activeModule == Ship && Path.tab)
	                        Engine.travelTo(Path);
	                    else if(Engine.activeModule == Path && Outside.tab)
	                        Engine.travelTo(Outside);
	                    else if(Engine.activeModule == Outside && Room.tab)
	                        Engine.travelTo(Room);
	                    Engine.log('left');
	                    break;
	                case 39: // Right
	                case 68:
	                    if(Engine.activeModule == Room && Outside.tab)
	                        Engine.travelTo(Outside);
	                    else if(Engine.activeModule == Outside && Path.tab)
	                        Engine.travelTo(Path);
	                    else if(Engine.activeModule == Path && Ship.tab)
	                        Engine.travelTo(Ship);
	                    Engine.log('right');
	                    break;
	            }
			}
		
			return false;
		},
	
		swipeLeft: function(e) {
			if(Engine.activeModule.swipeLeft) {
				Engine.activeModule.swipeLeft(e);
			}
		},
	
		swipeRight: function(e) {
			if(Engine.activeModule.swipeRight) {
				Engine.activeModule.swipeRight(e);
			}
		},
	
		swipeUp: function(e) {
			if(Engine.activeModule.swipeUp) {
				Engine.activeModule.swipeUp(e);
			}
		},
	
		swipeDown: function(e) {
			if(Engine.activeModule.swipeDown) {
				Engine.activeModule.swipeDown(e);
			}
		},
	
		disableSelection: function() {
			document.onselectstart = eventNullifier; // this is for IE
			document.onmousedown = eventNullifier; // this is for the rest
		},
	
		enableSelection: function() {
			document.onselectstart = eventPassthrough;
			document.onmousedown = eventPassthrough;
		},
		
		handleStateUpdates: function(e){
			
		},
		
		switchLanguage: function(dom){
			var lang = $(this).val();
			if(document.location.href.search(/[\?\&]lang=[a-z]+/) != -1){
				document.location.href = document.location.href.replace( /([\?\&]lang=)([a-z]+)/gi , "$1"+lang );
			}else{
				document.location.href = document.location.href + ( (document.location.href.search(/\?/) != -1 )?"&":"?") + "lang="+lang;
			}
		},
		
		saveLanguage: function(){
			var lang = decodeURIComponent((new RegExp('[?|&]lang=' + '([^&;]+?)(&|#|;|$)').exec(location.search)||[,""])[1].replace(/\+/g, '%20'))||null;	
			if(lang && typeof Storage != 'undefined' && localStorage) {
				localStorage.lang = lang;
			}
		}
	};
	
	function eventNullifier(e) {
		return $(e.target).hasClass('menuBtn');
	}
	
	function eventPassthrough(e) {
		return true;
	}
	
})();

//create jQuery Callbacks() to handle object events 
$.Dispatch = function( id ) {
	var callbacks,
		topic = id && Engine.topics[ id ];
	if ( !topic ) {
		callbacks = jQuery.Callbacks();
		topic = {
				publish: callbacks.fire,
				subscribe: callbacks.add,
				unsubscribe: callbacks.remove
		};
		if ( id ) {
			Engine.topics[ id ] = topic;
		}
	}
	return topic;
};

$(function() {
	Engine.init();
});
