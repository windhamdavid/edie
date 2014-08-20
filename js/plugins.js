window.log = function(){
  log.history = log.history || [];
  log.history.push(arguments);
  arguments.callee = arguments.callee.caller;  
  if(this.console) console.log( Array.prototype.slice.call(arguments) );
};
(function(b){function c(){}for(var d="assert,count,debug,dir,dirxml,error,exception,group,groupCollapsed,groupEnd,info,log,markTimeline,profile,profileEnd,time,timeEnd,trace,warn".split(","),a;a=d.pop();)b[a]=b[a]||c})(window.console=window.console||{});

/*
 * jQuery Nivo Gallery v0.7
 * http://dev7studios.com
 *
 * Copyright 2011, Gilbert Pellegrom
 * Free to use and abuse under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 * 
 * October 2011
 */

(function($) {

    $.nivoGallery = function(element, options){

        var defaults = {
            pauseTime: 3000,
            animSpeed: 300,
            effect: 'fade',
            startPaused: false,
            directionNav: true,
            progressBar: true,
            galleryLoaded: function(){},
            beforeChange: function(index, slide, paused){},
            afterChange: function(index, slide, paused){},
            galleryEnd: function(){}
        }
        
        var global = {
            slides: [],
            currentSlide: 0,
            totalSlides: 0,
            animating: false,
            paused: false,
            timer: null,
            progressTimer: null
        }

        var plugin = this;

        plugin.settings = {}

        var $element = $(element),
             element = element;

        plugin.init = function(){
            plugin.settings = $.extend({}, defaults, options);
            
            setupGallery();
        }

        /* Private Funcs */
        var setupGallery = function(){
            global.slides = $element.find('ul li').remove();
            global.totalSlides = global.slides.length;
            
            $element.find('ul').addClass('nivoGallery-slides');
            if(plugin.settings.progressBar){
                $element.append('<div class="nivoGallery-progress"></div>');
            }
            if(plugin.settings.directionNav){
                $element.append('<div class="nivoGallery-directionNav">' +
                    '<a class="nivoGallery-prev">Prev</a> <a class="nivoGallery-next">Next</a>' +
                '</div>');
            }
            $element.append('<div class="nivoGallery-bar">' +
                '<a class="nivoGallery-play playing" title="Play / Pause"></a>' +
                '<div class="nivoGallery-count">'+ setCount() +'</div>' +
                '<div class="nivoGallery-caption">'+ setCaption() +'</div>' +
                '<a class="nivoGallery-fullscreen" title="Toggle Fullscreen"></a>' +
            '</div>').fadeIn(200);
            
            loadSlide(global.currentSlide);
        }
        
        var setCount = function(){
            return (global.currentSlide + 1) +' / '+ global.totalSlides;
        }
        
        var setCaption = function(){
            var title = $(global.slides[global.currentSlide]).attr('data-title');
            var caption = $(global.slides[global.currentSlide]).attr('data-caption');
            var output = '';
            if(title) output += '<span class="nivoGallery-captionTitle">'+ title +'</span>';
            if(caption) output += caption;
            return output;
        }
        
        var runTimeout = function(){
            clearTimeout(global.timer);
            if(plugin.settings.progressBar){ 
                clearInterval(global.progressTimer);
                $element.find('.nivoGallery-progress').width('0%');
            }
            
            if(!global.paused){
                global.timer = setTimeout(function(){ $element.trigger('nextslide'); }, plugin.settings.pauseTime);
                
                if(plugin.settings.progressBar){
                    var progressStart = new Date();
                    global.progressTimer = setInterval(function(){
                        var ellapsed = new Date() - progressStart;
                        var perc = (ellapsed / plugin.settings.pauseTime) * 100;
                        $element.find('.nivoGallery-progress').width(perc + '%');
                        if(perc > 100){
                            clearInterval(global.progressTimer);
                            $element.find('.nivoGallery-progress').width('0%');
                        }
                    }, 10);
                }
            }
        }  
                
        var loadSlide = function(idx, callbackFn){
        	if($(global.slides[idx]).data('loaded')){ 
                if(typeof callbackFn == 'function') callbackFn.call(this);
                return;
            }
        	
            if($(global.slides[idx]).find('img').length > 0 && ($(global.slides[idx]).attr('data-type') != 'html' && $(global.slides[idx]).attr('data-type') != 'video')){
                $element.removeClass('loaded');
                var img = new Image();
                $(img).load(function(){
                    $element.find('.nivoGallery-slides').append(global.slides[idx]);
                    $(global.slides[idx]).fadeIn(plugin.settings.animSpeed);
                    
                    if(idx == 0){
                        $element.trigger('galleryloaded');
                    }
                    $element.addClass('loaded');
                    $(global.slides[idx]).data('loaded', true);
                    $(global.slides[idx]).addClass('slide-'+ (idx + 1));
                    if(typeof callbackFn == 'function') callbackFn.call(this);
                })
                .attr('src', $(global.slides[idx]).find('img:first').attr('src'))
                .attr('alt', ($(global.slides[idx]).find('img:first').attr('alt') != undefined) ? $(global.slides[idx]).find('img:first').attr('alt') : '')
                .attr('title', ($(global.slides[idx]).find('img:first').attr('title') != undefined) ? $(global.slides[idx]).find('img:first').attr('title') : '');
            } else {
                $element.find('.nivoGallery-slides').append(global.slides[idx]);
                if(idx == 0){
                    $element.trigger('galleryloaded');
                }
                $element.addClass('loaded');
                $(global.slides[idx]).data('loaded', true);
                $(global.slides[idx]).addClass('slide-'+ (idx + 1));
                
                if($(global.slides[idx]).attr('data-type') == 'html') $(global.slides[idx]).wrapInner('<div class="nivoGallery-htmlwrap"></div>');
                if($(global.slides[idx]).attr('data-type') == 'video') $(global.slides[idx]).wrapInner('<div class="nivoGallery-videowrap"></div>');
                
                if(typeof callbackFn == 'function') callbackFn.call(this);
            }
        }
        
        var runTransition = function(direction){
            if(global.animating) return;
            plugin.settings.beforeChange.call(this, global.currentSlide, $(global.slides[global.currentSlide]), global.paused);
            
            if(plugin.settings.effect == 'fade'){
                var galleryEnd = false;
                global.animating = true;
                $(global.slides[global.currentSlide]).fadeOut(plugin.settings.animSpeed, function(){
                    if(direction == 'prev'){
                        global.currentSlide--;
                        if(global.currentSlide < 0){ 
                            global.currentSlide = global.totalSlides - 1;
                            galleryEnd = true;
                        }
                    } else {
                        global.currentSlide++;
                        if(global.currentSlide >= global.totalSlides){ 
                            global.currentSlide = 0;
                            galleryEnd = true;
                        }
                    }
                    loadSlide(global.currentSlide, function(){
                        $element.find('.nivoGallery-count').text(setCount());
                        $element.find('.nivoGallery-caption').html(setCaption());
                        
                        $(global.slides[global.currentSlide]).fadeIn(plugin.settings.animSpeed, function(){
                            global.animating = false;
                            runTimeout();
                            plugin.settings.afterChange.call(this, global.currentSlide, $(global.slides[global.currentSlide]), global.paused);
                            if(galleryEnd) plugin.settings.galleryEnd.call(this);
                        });
                    });
                });
            }
        }
        
        /* Public Funcs */
        plugin.play = function(){
            $element.find('.nivoGallery-play').addClass('playing');
            global.paused = false;
            runTimeout();
        }
        
        plugin.pause = function(){
            $element.find('.nivoGallery-play').removeClass('playing');
            global.paused = true;
            runTimeout();
        }
        
        plugin.nextSlide = function(){
            plugin.pause();
            runTransition('next');
        }
        
        plugin.prevSlide = function(){
            plugin.pause();
            runTransition('prev');
        }
        
        plugin.goTo = function(idx){
            if(idx == global.currentSlide || global.animating) return;
            $(global.slides[global.currentSlide]).fadeOut(plugin.settings.animSpeed);
            global.currentSlide = (idx - 1);
            if(global.currentSlide < 0) global.currentSlide = global.totalSlides - 1;
            if(global.currentSlide >= global.totalSlides - 1) global.currentSlide = global.totalSlides - 2;
                        
            plugin.pause();
            runTransition('next');
        }
        
        /* Events */
        $element.bind('galleryloaded', function(){
            $(global.slides[global.currentSlide]).fadeIn(200);
            
            if(plugin.settings.startPaused){
                plugin.pause();
            } else {
                runTimeout();
            }
            
            plugin.settings.galleryLoaded.call(this);
        });
        
        $element.find('.nivoGallery-play').live('click', function(){
            $(this).toggleClass('playing');
            global.paused = !global.paused;
            runTimeout();
            return false;
        });
        
        $element.bind('nextslide', function(){
            runTransition('next');
        });
        
        $element.find('.nivoGallery-prev').live('click', function(){
        	plugin.prevSlide();
        });
        
        $element.find('.nivoGallery-next').live('click', function(){
        	plugin.nextSlide();
        });
        
        $element.find('.nivoGallery-fullscreen').live('click', function(){
            $element.toggleClass('fullscreen');
        });
        
        $(document).keyup(function(e){
            if(e.keyCode == 27){
                $element.removeClass('fullscreen');
            }
        });

        plugin.init();

    }

    $.fn.nivoGallery = function(options){

        return this.each(function() {
            if (undefined == $(this).data('nivoGallery')){
                var plugin = new $.nivoGallery(this, options);
                $(this).data('nivoGallery', plugin);
            }
        });

    }

})(jQuery);


/*
 * Superfish v1.4.8 - jQuery menu widget
 * Copyright (c) 2008 Joel Birch
 *
 * Dual licensed under the MIT and GPL licenses:
 * 	http://www.opensource.org/licenses/mit-license.php
 * 	http://www.gnu.org/licenses/gpl.html
 *
 * CHANGELOG: http://users.tpg.com.au/j_birch/plugins/superfish/changelog.txt
 */

;(function($){
	$.fn.superfish = function(op){

		var sf = $.fn.superfish,
			c = sf.c,
			$arrow = $(['<span class="',c.arrowClass,'"> &#187;</span>'].join('')),
			over = function(){
				var $$ = $(this), menu = getMenu($$);
				clearTimeout(menu.sfTimer);
				$$.showSuperfishUl().siblings().hideSuperfishUl();
			},
			out = function(){
				var $$ = $(this), menu = getMenu($$), o = sf.op;
				clearTimeout(menu.sfTimer);
				menu.sfTimer=setTimeout(function(){
					o.retainPath=($.inArray($$[0],o.$path)>-1);
					$$.hideSuperfishUl();
					if (o.$path.length && $$.parents(['li.',o.hoverClass].join('')).length<1){over.call(o.$path);}
				},o.delay);	
			},
			getMenu = function($menu){
				var menu = $menu.parents(['ul.',c.menuClass,':first'].join(''))[0];
				sf.op = sf.o[menu.serial];
				return menu;
			},
			addArrow = function($a){ $a.addClass(c.anchorClass).append($arrow.clone()); };
			
		return this.each(function() {
			var s = this.serial = sf.o.length;
			var o = $.extend({},sf.defaults,op);
			o.$path = $('li.'+o.pathClass,this).slice(0,o.pathLevels).each(function(){
				$(this).addClass([o.hoverClass,c.bcClass].join(' '))
					.filter('li:has(ul)').removeClass(o.pathClass);
			});
			sf.o[s] = sf.op = o;
			
			$('li:has(ul)',this)[($.fn.hoverIntent && !o.disableHI) ? 'hoverIntent' : 'hover'](over,out).each(function() {
				if (o.autoArrows) addArrow( $('>a:first-child',this) );
			})
			.not('.'+c.bcClass)
				.hideSuperfishUl();
			
			var $a = $('a',this);
			$a.each(function(i){
				var $li = $a.eq(i).parents('li');
				$a.eq(i).focus(function(){over.call($li);}).blur(function(){out.call($li);});
			});
			o.onInit.call(this);
			
		}).each(function() {
			var menuClasses = [c.menuClass];
			if (sf.op.dropShadows  && !($.browser.msie && $.browser.version < 7)) menuClasses.push(c.shadowClass);
			$(this).addClass(menuClasses.join(' '));
		});
	};

	var sf = $.fn.superfish;
	sf.o = [];
	sf.op = {};
	sf.IE7fix = function(){
		var o = sf.op;
		if ($.browser.msie && $.browser.version > 6 && o.dropShadows && o.animation.opacity!=undefined)
			this.toggleClass(sf.c.shadowClass+'-off');
		};
	sf.c = {
		bcClass     : 'sf-breadcrumb',
		menuClass   : 'sf-js-enabled',
		anchorClass : 'sf-with-ul',
		arrowClass  : 'sf-sub-indicator',
		shadowClass : 'sf-shadow'
	};
	sf.defaults = {
		hoverClass	: 'sfHover',
		pathClass	: 'overideThisToUse',
		pathLevels	: 1,
		delay		: 800,
		animation	: {opacity:'show'},
		speed		: 'normal',
		autoArrows	: true,
		dropShadows : true,
		disableHI	: false,		// true disables hoverIntent detection
		onInit		: function(){}, // callback functions
		onBeforeShow: function(){},
		onShow		: function(){},
		onHide		: function(){}
	};
	$.fn.extend({
		hideSuperfishUl : function(){
			var o = sf.op,
				not = (o.retainPath===true) ? o.$path : '';
			o.retainPath = false;
			var $ul = $(['li.',o.hoverClass].join(''),this).add(this).not(not).removeClass(o.hoverClass)
					.find('>ul').hide().css('visibility','hidden');
			o.onHide.call($ul);
			return this;
		},
		showSuperfishUl : function(){
			var o = sf.op,
				sh = sf.c.shadowClass+'-off',
				$ul = this.addClass(o.hoverClass)
					.find('>ul:hidden').css('visibility','visible');
			sf.IE7fix.call($ul);
			o.onBeforeShow.call($ul);
			$ul.animate(o.animation,o.speed,function(){ sf.IE7fix.call($ul); o.onShow.call($ul); });
			return this;
		}
	});

})(jQuery);

(function($){
	/* hoverIntent by Brian Cherne */
	$.fn.hoverIntent = function(f,g) {
		// default configuration options
		var cfg = {
			sensitivity: 7,
			interval: 100,
			timeout: 0
		};
		// override configuration options with user supplied object
		cfg = $.extend(cfg, g ? { over: f, out: g } : f );

		// instantiate variables
		// cX, cY = current X and Y position of mouse, updated by mousemove event
		// pX, pY = previous X and Y position of mouse, set by mouseover and polling interval
		var cX, cY, pX, pY;

		// A private function for getting mouse position
		var track = function(ev) {
			cX = ev.pageX;
			cY = ev.pageY;
		};

		// A private function for comparing current and previous mouse position
		var compare = function(ev,ob) {
			ob.hoverIntent_t = clearTimeout(ob.hoverIntent_t);
			// compare mouse positions to see if they've crossed the threshold
			if ( ( Math.abs(pX-cX) + Math.abs(pY-cY) ) < cfg.sensitivity ) {
				$(ob).unbind("mousemove",track);
				// set hoverIntent state to true (so mouseOut can be called)
				ob.hoverIntent_s = 1;
				return cfg.over.apply(ob,[ev]);
			} else {
				// set previous coordinates for next time
				pX = cX; pY = cY;
				// use self-calling timeout, guarantees intervals are spaced out properly (avoids JavaScript timer bugs)
				ob.hoverIntent_t = setTimeout( function(){compare(ev, ob);} , cfg.interval );
			}
		};

		// A private function for delaying the mouseOut function
		var delay = function(ev,ob) {
			ob.hoverIntent_t = clearTimeout(ob.hoverIntent_t);
			ob.hoverIntent_s = 0;
			return cfg.out.apply(ob,[ev]);
		};

		// A private function for handling mouse 'hovering'
		var handleHover = function(e) {
			// next three lines copied from jQuery.hover, ignore children onMouseOver/onMouseOut
			var p = (e.type == "mouseover" ? e.fromElement : e.toElement) || e.relatedTarget;
			while ( p && p != this ) { try { p = p.parentNode; } catch(e) { p = this; } }
			if ( p == this ) { return false; }

			// copy objects to be passed into t (required for event object to be passed in IE)
			var ev = jQuery.extend({},e);
			var ob = this;

			// cancel hoverIntent timer if it exists
			if (ob.hoverIntent_t) { ob.hoverIntent_t = clearTimeout(ob.hoverIntent_t); }

			// else e.type == "onmouseover"
			if (e.type == "mouseover") {
				// set "previous" X and Y position based on initial entry point
				pX = ev.pageX; pY = ev.pageY;
				// update "current" X and Y position based on mousemove
				$(ob).bind("mousemove",track);
				// start polling interval (self-calling timeout) to compare mouse coordinates over time
				if (ob.hoverIntent_s != 1) { ob.hoverIntent_t = setTimeout( function(){compare(ev,ob);} , cfg.interval );}

			// else e.type == "onmouseout"
			} else {
				// unbind expensive mousemove event
				$(ob).unbind("mousemove",track);
				// if hoverIntent state is true, then call the mouseOut function after the specified delay
				if (ob.hoverIntent_s == 1) { ob.hoverIntent_t = setTimeout( function(){delay(ev,ob);} , cfg.timeout );}
			}
		};

		// bind the function to the two event listeners
		return this.mouseover(handleHover).mouseout(handleHover);
	};
	
})(jQuery);


/*!
* MediaElement.js
* HTML5 <video> and <audio> shim and player
* http://mediaelementjs.com/
*
* Creates a JavaScript object that mimics HTML5 MediaElement API
* for browsers that don't understand HTML5 or can't play the provided codec
* Can play MP4 (H.264), Ogg, WebM, FLV, WMV, WMA, ACC, and MP3
*
* Copyright 2010-2011, John Dyer (http://j.hn)
* Dual licensed under the MIT or GPL Version 2 licenses.
*
*/var mejs=mejs||{};mejs.version="2.3.0";mejs.meIndex=0;mejs.plugins={silverlight:[{version:[3,0],types:["video/mp4","video/m4v","video/mov","video/wmv","audio/wma","audio/m4a","audio/mp3","audio/wav","audio/mpeg"]}],flash:[{version:[9,0,124],types:["video/mp4","video/m4v","video/mov","video/flv","video/x-flv","audio/flv","audio/x-flv","audio/mp3","audio/m4a","audio/mpeg"]}]};
mejs.Utility={encodeUrl:function(a){return encodeURIComponent(a)},escapeHTML:function(a){return a.toString().split("&").join("&amp;").split("<").join("&lt;").split('"').join("&quot;")},absolutizeUrl:function(a){var b=document.createElement("div");b.innerHTML='<a href="'+this.escapeHTML(a)+'">x</a>';return b.firstChild.href},getScriptPath:function(a){for(var b=0,c,d="",e="",g,f=document.getElementsByTagName("script");b<f.length;b++){g=f[b].src;for(c=0;c<a.length;c++){e=a[c];if(g.indexOf(e)>-1){d=g.substring(0,
g.indexOf(e));break}}if(d!=="")break}return d},secondsToTimeCode:function(a,b,c,d){if(typeof c=="undefined")c=false;else if(typeof d=="undefined")d=25;var e=Math.floor(a/3600)%24,g=Math.floor(a/60)%60,f=Math.floor(a%60);a=Math.floor((a%1*d).toFixed(3));return(b||e>0?(e<10?"0"+e:e)+":":"")+(g<10?"0"+g:g)+":"+(f<10?"0"+f:f)+(c?":"+(a<10?"0"+a:a):"")},timeCodeToSeconds:function(a,b,c,d){if(typeof c=="undefined")c=false;else if(typeof d=="undefined")d=25;a=a.split(":");b=parseInt(a[0]);var e=parseInt(a[1]),
g=parseInt(a[2]),f=0,j=0;if(c)f=parseInt(a[3])/d;return j=b*3600+e*60+g+f}};
mejs.PluginDetector={hasPluginVersion:function(a,b){var c=this.plugins[a];b[1]=b[1]||0;b[2]=b[2]||0;return c[0]>b[0]||c[0]==b[0]&&c[1]>b[1]||c[0]==b[0]&&c[1]==b[1]&&c[2]>=b[2]?true:false},nav:window.navigator,ua:window.navigator.userAgent.toLowerCase(),plugins:[],addPlugin:function(a,b,c,d,e){this.plugins[a]=this.detectPlugin(b,c,d,e)},detectPlugin:function(a,b,c,d){var e=[0,0,0],g;if(typeof this.nav.plugins!="undefined"&&typeof this.nav.plugins[a]=="object"){if((c=this.nav.plugins[a].description)&&
!(typeof this.nav.mimeTypes!="undefined"&&this.nav.mimeTypes[b]&&!this.nav.mimeTypes[b].enabledPlugin)){e=c.replace(a,"").replace(/^\s+/,"").replace(/\sr/gi,".").split(".");for(a=0;a<e.length;a++)e[a]=parseInt(e[a].match(/\d+/),10)}}else if(typeof window.ActiveXObject!="undefined")try{if(g=new ActiveXObject(c))e=d(g)}catch(f){}return e}};
mejs.PluginDetector.addPlugin("flash","Shockwave Flash","application/x-shockwave-flash","ShockwaveFlash.ShockwaveFlash",function(a){var b=[];if(a=a.GetVariable("$version")){a=a.split(" ")[1].split(",");b=[parseInt(a[0],10),parseInt(a[1],10),parseInt(a[2],10)]}return b});
mejs.PluginDetector.addPlugin("silverlight","Silverlight Plug-In","application/x-silverlight-2","AgControl.AgControl",function(a){var b=[0,0,0,0],c=function(d,e,g,f){for(;d.isVersionSupported(e[0]+"."+e[1]+"."+e[2]+"."+e[3]);)e[g]+=f;e[g]-=f};c(a,b,0,1);c(a,b,1,1);c(a,b,2,1E4);c(a,b,2,1E3);c(a,b,2,100);c(a,b,2,10);c(a,b,2,1);c(a,b,3,1);return b});
mejs.MediaFeatures={init:function(){var a=this,b=document,c=mejs.PluginDetector.nav,d=mejs.PluginDetector.ua.toLowerCase(),e,g=["source","track","audio","video"];a.isiPad=d.match(/ipad/i)!==null;a.isiPhone=d.match(/iphone/i)!==null;a.isiOS=a.isiPhone||a.isiPad;a.isAndroid=d.match(/android/i)!==null;a.isBustedAndroid=d.match(/android 2\.[12]/)!==null;a.isIE=c.appName.toLowerCase().indexOf("microsoft")!=-1;a.isChrome=d.match(/chrome/gi)!==null;a.isFirefox=d.match(/firefox/gi)!==null;a.isGecko=d.match(/gecko/gi)!==
null;a.isWebkit=d.match(/webkit/gi)!==null;for(c=0;c<g.length;c++)e=document.createElement(g[c]);a.supportsMediaTag=typeof e.canPlayType!=="undefined"||a.isBustedAndroid;a.hasSemiNativeFullScreen=typeof e.webkitEnterFullscreen!=="undefined";a.hasWebkitNativeFullScreen=typeof e.webkitRequestFullScreen!=="undefined";a.hasMozNativeFullScreen=typeof e.mozRequestFullScreen!=="undefined";a.hasTrueNativeFullScreen=a.hasWebkitNativeFullScreen||a.hasMozNativeFullScreen;if(this.isChrome)a.hasSemiNativeFullScreen=
false;if(a.hasTrueNativeFullScreen){a.fullScreenEventName=a.hasWebkitNativeFullScreen?"webkitfullscreenchange":"mozfullscreenchange";a.isFullScreen=function(){if(e.mozRequestFullScreen)return b.mozFullScreen;else if(e.webkitRequestFullScreen)return b.webkitIsFullScreen};a.requestFullScreen=function(f){if(a.hasWebkitNativeFullScreen)f.webkitRequestFullScreen();else a.hasMozNativeFullScreen&&f.mozRequestFullScreen()};a.cancelFullScreen=function(){if(a.hasWebkitNativeFullScreen)document.webkitCancelFullScreen();
else a.hasMozNativeFullScreen&&document.mozCancelFullScreen()}}if(a.hasSemiNativeFullScreen&&d.match(/mac os x 10_5/i)){a.hasNativeFullScreen=false;a.hasSemiNativeFullScreen=false}}};mejs.MediaFeatures.init();
mejs.HtmlMediaElement={pluginType:"native",isFullScreen:false,setCurrentTime:function(a){this.currentTime=a},setMuted:function(a){this.muted=a},setVolume:function(a){this.volume=a},stop:function(){this.pause()},setSrc:function(a){for(var b=this.getElementsByTagName("source");b.length>0;)this.removeChild(b[0]);if(typeof a=="string")this.src=a;else{var c;for(b=0;b<a.length;b++){c=a[b];if(this.canPlayType(c.type))this.src=c.src}}},setVideoSize:function(a,b){this.width=a;this.height=b}};
mejs.PluginMediaElement=function(a,b,c){this.id=a;this.pluginType=b;this.src=c;this.events={}};
mejs.PluginMediaElement.prototype={pluginElement:null,pluginType:"",isFullScreen:false,playbackRate:-1,defaultPlaybackRate:-1,seekable:[],played:[],paused:true,ended:false,seeking:false,duration:0,error:null,muted:false,volume:1,currentTime:0,play:function(){if(this.pluginApi!=null){this.pluginApi.playMedia();this.paused=false}},load:function(){if(this.pluginApi!=null){this.pluginApi.loadMedia();this.paused=false}},pause:function(){if(this.pluginApi!=null){this.pluginApi.pauseMedia();this.paused=
true}},stop:function(){if(this.pluginApi!=null){this.pluginApi.stopMedia();this.paused=true}},canPlayType:function(a){var b,c,d,e=mejs.plugins[this.pluginType];for(b=0;b<e.length;b++){d=e[b];if(mejs.PluginDetector.hasPluginVersion(this.pluginType,d.version))for(c=0;c<d.types.length;c++)if(a==d.types[c])return true}return false},setSrc:function(a){if(typeof a=="string"){this.pluginApi.setSrc(mejs.Utility.absolutizeUrl(a));this.src=mejs.Utility.absolutizeUrl(a)}else{var b,c;for(b=0;b<a.length;b++){c=
a[b];if(this.canPlayType(c.type)){this.pluginApi.setSrc(mejs.Utility.absolutizeUrl(c.src));this.src=mejs.Utility.absolutizeUrl(a)}}}},setCurrentTime:function(a){if(this.pluginApi!=null){this.pluginApi.setCurrentTime(a);this.currentTime=a}},setVolume:function(a){if(this.pluginApi!=null){this.pluginApi.setVolume(a);this.volume=a}},setMuted:function(a){if(this.pluginApi!=null){this.pluginApi.setMuted(a);this.muted=a}},setVideoSize:function(a,b){if(this.pluginElement.style){this.pluginElement.style.width=
a+"px";this.pluginElement.style.height=b+"px"}this.pluginApi!=null&&this.pluginApi.setVideoSize(a,b)},setFullscreen:function(a){this.pluginApi!=null&&this.pluginApi.setFullscreen(a)},enterFullScreen:function(){this.setFullscreen(true)},enterFullScreen:function(){this.setFullscreen(false)},addEventListener:function(a,b){this.events[a]=this.events[a]||[];this.events[a].push(b)},removeEventListener:function(a,b){if(!a){this.events={};return true}var c=this.events[a];if(!c)return true;if(!b){this.events[a]=
[];return true}for(i=0;i<c.length;i++)if(c[i]===b){this.events[a].splice(i,1);return true}return false},dispatchEvent:function(a){var b,c,d=this.events[a];if(d){c=Array.prototype.slice.call(arguments,1);for(b=0;b<d.length;b++)d[b].apply(null,c)}}};
mejs.MediaPluginBridge={pluginMediaElements:{},htmlMediaElements:{},registerPluginElement:function(a,b,c){this.pluginMediaElements[a]=b;this.htmlMediaElements[a]=c},initPlugin:function(a){var b=this.pluginMediaElements[a],c=this.htmlMediaElements[a];switch(b.pluginType){case "flash":b.pluginElement=b.pluginApi=document.getElementById(a);break;case "silverlight":b.pluginElement=document.getElementById(b.id);b.pluginApi=b.pluginElement.Content.MediaElementJS}b.pluginApi!=null&&b.success&&b.success(b,
c)},fireEvent:function(a,b,c){var d,e;a=this.pluginMediaElements[a];a.ended=false;a.paused=true;b={type:b,target:a};for(d in c){a[d]=c[d];b[d]=c[d]}e=c.bufferedTime||0;b.target.buffered=b.buffered={start:function(){return 0},end:function(){return e},length:1};a.dispatchEvent(b.type,b)}};
mejs.MediaElementDefaults={mode:"auto",plugins:["flash","silverlight"],enablePluginDebug:false,type:"",pluginPath:mejs.Utility.getScriptPath(["mediaelement.js","mediaelement.min.js","mediaelement-and-player.js","mediaelement-and-player.min.js"]),flashName:"flashmediaelement.swf",enablePluginSmoothing:false,silverlightName:"silverlightmediaelement.xap",defaultVideoWidth:480,defaultVideoHeight:270,pluginWidth:-1,pluginHeight:-1,timerRate:250,startVolume:0.8,success:function(){},error:function(){}};
mejs.MediaElement=function(a,b){return mejs.HtmlMediaElementShim.create(a,b)};
mejs.HtmlMediaElementShim={create:function(a,b){var c=mejs.MediaElementDefaults,d=typeof a=="string"?document.getElementById(a):a,e=d.tagName.toLowerCase(),g=e==="audio"||e==="video",f=g?d.getAttribute("src"):d.getAttribute("href");e=d.getAttribute("poster");var j=d.getAttribute("autoplay"),h=d.getAttribute("preload"),l=d.getAttribute("controls"),k;for(k in b)c[k]=b[k];f=f=="undefined"||f==""||f===null?null:f;e=typeof e=="undefined"||e===null?"":e;h=typeof h=="undefined"||h===null||h==="false"?"none":
h;j=!(typeof j=="undefined"||j===null||j==="false");l=!(typeof l=="undefined"||l===null||l==="false");k=this.determinePlayback(d,c,mejs.MediaFeatures.supportsMediaTag,g,f);k.url=k.url!==null?mejs.Utility.absolutizeUrl(k.url):"";if(k.method=="native"){if(mejs.MediaFeatures.isBustedAndroid){d.src=k.url;d.addEventListener("click",function(){d.play()},true)}return this.updateNative(k,c,j,h)}else if(k.method!=="")return this.createPlugin(k,c,e,j,h,l);else this.createErrorMessage(k,c,e)},determinePlayback:function(a,
b,c,d,e){var g=[],f,j,h={method:"",url:"",htmlMediaElement:a,isVideo:a.tagName.toLowerCase()!="audio"},l,k;if(typeof b.type!="undefined"&&b.type!=="")if(typeof b.type=="string")g.push({type:b.type,url:e});else for(f=0;f<b.type.length;f++)g.push({type:b.type[f],url:e});else if(e!==null){j=this.formatType(e,a.getAttribute("type"));g.push({type:j,url:e})}else for(f=0;f<a.childNodes.length;f++){j=a.childNodes[f];if(j.nodeType==1&&j.tagName.toLowerCase()=="source"){e=j.getAttribute("src");j=this.formatType(e,
j.getAttribute("type"));g.push({type:j,url:e})}}if(!d&&g.length>0&&g[0].url!==null&&this.getTypeFromFile(g[0].url).indexOf("audio")>-1)h.isVideo=false;if(mejs.MediaFeatures.isBustedAndroid)a.canPlayType=function(m){return m.match(/video\/(mp4|m4v)/gi)!==null?"maybe":""};if(c&&(b.mode==="auto"||b.mode==="native")){if(!d){f=document.createElement(h.isVideo?"video":"audio");a.parentNode.insertBefore(f,a);a.style.display="none";h.htmlMediaElement=a=f}for(f=0;f<g.length;f++)if(a.canPlayType(g[f].type).replace(/no/,
"")!==""||a.canPlayType(g[f].type.replace(/mp3/,"mpeg")).replace(/no/,"")!==""){h.method="native";h.url=g[f].url;break}if(h.method==="native"){if(h.url!==null)a.src=h.url;return h}}if(b.mode==="auto"||b.mode==="shim")for(f=0;f<g.length;f++){j=g[f].type;for(a=0;a<b.plugins.length;a++){e=b.plugins[a];l=mejs.plugins[e];for(c=0;c<l.length;c++){k=l[c];if(mejs.PluginDetector.hasPluginVersion(e,k.version))for(d=0;d<k.types.length;d++)if(j==k.types[d]){h.method=e;h.url=g[f].url;return h}}}}if(h.method===
"")h.url=g[0].url;return h},formatType:function(a,b){return a&&!b?this.getTypeFromFile(a):b&&~b.indexOf(";")?b.substr(0,b.indexOf(";")):b},getTypeFromFile:function(a){a=a.substring(a.lastIndexOf(".")+1);return(/(mp4|m4v|ogg|ogv|webm|flv|wmv|mpeg|mov)/gi.test(a)?"video":"audio")+"/"+a},createErrorMessage:function(a,b,c){var d=a.htmlMediaElement,e=document.createElement("div");e.className="me-cannotplay";try{e.style.width=d.width+"px";e.style.height=d.height+"px"}catch(g){}e.innerHTML=c!==""?'<a href="'+
a.url+'"><img src="'+c+'" /></a>':'<a href="'+a.url+'"><span>Download File</span></a>';d.parentNode.insertBefore(e,d);d.style.display="none";b.error(d)},createPlugin:function(a,b,c,d,e,g){c=a.htmlMediaElement;var f=1,j=1,h="me_"+a.method+"_"+mejs.meIndex++,l=new mejs.PluginMediaElement(h,a.method,a.url),k=document.createElement("div"),m;for(m=c.parentNode;m!==null&&m.tagName.toLowerCase()!="body";){if(m.parentNode.tagName.toLowerCase()=="p"){m.parentNode.parentNode.insertBefore(m,m.parentNode);break}m=
m.parentNode}if(a.isVideo){f=b.videoWidth>0?b.videoWidth:c.getAttribute("width")!==null?c.getAttribute("width"):b.defaultVideoWidth;j=b.videoHeight>0?b.videoHeight:c.getAttribute("height")!==null?c.getAttribute("height"):b.defaultVideoHeight;f=mejs.Utility.encodeUrl(f);j=mejs.Utility.encodeUrl(j)}else if(b.enablePluginDebug){f=320;j=240}l.success=b.success;mejs.MediaPluginBridge.registerPluginElement(h,l,c);k.className="me-plugin";c.parentNode.insertBefore(k,c);d=["id="+h,"isvideo="+(a.isVideo?"true":
"false"),"autoplay="+(d?"true":"false"),"preload="+e,"width="+f,"startvolume="+b.startVolume,"timerrate="+b.timerRate,"height="+j];if(a.url!==null)a.method=="flash"?d.push("file="+mejs.Utility.encodeUrl(a.url)):d.push("file="+a.url);b.enablePluginDebug&&d.push("debug=true");b.enablePluginSmoothing&&d.push("smoothing=true");g&&d.push("controls=true");switch(a.method){case "silverlight":k.innerHTML='<object data="data:application/x-silverlight-2," type="application/x-silverlight-2" id="'+h+'" name="'+
h+'" width="'+f+'" height="'+j+'"><param name="initParams" value="'+d.join(",")+'" /><param name="windowless" value="true" /><param name="background" value="black" /><param name="minRuntimeVersion" value="3.0.0.0" /><param name="autoUpgrade" value="true" /><param name="source" value="'+b.pluginPath+b.silverlightName+'" /></object>';break;case "flash":if(mejs.MediaFeatures.isIE){a=document.createElement("div");k.appendChild(a);a.outerHTML='<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" codebase="http://download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab" id="'+
h+'" width="'+f+'" height="'+j+'"><param name="movie" value="'+b.pluginPath+b.flashName+"?x="+new Date+'" /><param name="flashvars" value="'+d.join("&amp;")+'" /><param name="quality" value="high" /><param name="bgcolor" value="#000000" /><param name="wmode" value="transparent" /><param name="allowScriptAccess" value="always" /><param name="allowFullScreen" value="true" /></object>'}else k.innerHTML='<embed id="'+h+'" name="'+h+'" play="true" loop="false" quality="high" bgcolor="#000000" wmode="transparent" allowScriptAccess="always" allowFullScreen="true" type="application/x-shockwave-flash" pluginspage="http://www.macromedia.com/go/getflashplayer" src="'+
b.pluginPath+b.flashName+'" flashvars="'+d.join("&")+'" width="'+f+'" height="'+j+'"></embed>'}c.style.display="none";return l},updateNative:function(a,b){var c=a.htmlMediaElement,d;for(d in mejs.HtmlMediaElement)c[d]=mejs.HtmlMediaElement[d];b.success(c,c);return c}};window.mejs=mejs;window.MediaElement=mejs.MediaElement;

/*!
 * MediaElementPlayer
 * http://mediaelementjs.com/
 *
 * Creates a controller bar for HTML5 <video> add <audio> tags
 * using jQuery and MediaElement.js (HTML5 Flash/Silverlight wrapper)
 *
 * Copyright 2010-2011, John Dyer (http://j.hn/)
 * Dual licensed under the MIT or GPL Version 2 licenses.
 *
 */if(typeof jQuery!="undefined")mejs.$=jQuery;else if(typeof ender!="undefined")mejs.$=ender;
(function(f){mejs.MepDefaults={poster:"",defaultVideoWidth:480,defaultVideoHeight:270,videoWidth:-1,videoHeight:-1,audioWidth:400,audioHeight:30,startVolume:0.8,loop:false,enableAutosize:true,alwaysShowHours:false,showTimecodeFrameCount:false,framesPerSecond:25,alwaysShowControls:false,iPadUseNativeControls:false,iPhoneUseNativeControls:false,AndroidUseNativeControls:false,features:["playpause","current","progress","duration","tracks","volume","fullscreen"],isVideo:true};mejs.mepIndex=0;mejs.MediaElementPlayer=
function(a,c){if(!(this instanceof mejs.MediaElementPlayer))return new mejs.MediaElementPlayer(a,c);this.$media=this.$node=f(a);this.node=this.media=this.$media[0];if(typeof this.node.player!="undefined")return this.node.player;else this.node.player=this;this.options=f.extend({},mejs.MepDefaults,c);this.init();return this};mejs.MediaElementPlayer.prototype={init:function(){var a=this,c=mejs.MediaFeatures,b=f.extend(true,{},a.options,{success:function(e,h){a.meReady(e,h)},error:function(e){a.handleError(e)}}),
d=a.media.tagName.toLowerCase();a.isDynamic=d!=="audio"&&d!=="video";a.isVideo=a.isDynamic?a.options.isVideo:d!=="audio"&&a.options.isVideo;if(c.isiPad&&a.options.iPadUseNativeControls||c.isiPhone&&a.options.iPhoneUseNativeControls){a.$media.attr("controls","controls");a.$media.removeAttr("poster");if(c.isiPad&&a.media.getAttribute("autoplay")!==null){a.media.load();a.media.play()}}else if(!(c.isAndroid&&a.AndroidUseNativeControls)){a.$media.removeAttr("controls");a.id="mep_"+mejs.mepIndex++;a.container=
f('<div id="'+a.id+'" class="mejs-container"><div class="mejs-inner"><div class="mejs-mediaelement"></div><div class="mejs-layers"></div><div class="mejs-controls"></div><div class="mejs-clear"></div></div></div>').addClass(a.$media[0].className).insertBefore(a.$media);a.container.addClass((c.isAndroid?"mejs-android ":"")+(c.isiOS?"mejs-ios ":"")+(c.isiPad?"mejs-ipad ":"")+(c.isiPhone?"mejs-iphone ":"")+(a.isVideo?"mejs-video ":"mejs-audio "));if(c.isiOS){c=a.$media.clone();a.container.find(".mejs-mediaelement").append(c);
a.$media.remove();a.$node=a.$media=c;a.node=a.media=c[0]}else a.container.find(".mejs-mediaelement").append(a.$media);a.controls=a.container.find(".mejs-controls");a.layers=a.container.find(".mejs-layers");if(a.isVideo){a.width=a.options.videoWidth>0||a.options.videoWidth.toString().indexOf("%")>-1?a.options.videoWidth:a.media.style.width!==""&&a.media.style.width!==null?a.media.style.width:a.media.getAttribute("width")!==null?a.$media.attr("width"):a.options.defaultVideoWidth;a.height=a.options.videoHeight>
0||a.options.videoHeight.toString().indexOf("%")>-1?a.options.videoHeight:a.media.style.height!==""&&a.media.style.height!==null?a.media.style.height:a.$media[0].getAttribute("height")!==null?a.$media.attr("height"):a.options.defaultVideoHeight}else{a.width=a.options.audioWidth;a.height=a.options.audioHeight}a.setPlayerSize(a.width,a.height);b.pluginWidth=a.height;b.pluginHeight=a.width}mejs.MediaElement(a.$media[0],b)},controlsAreVisible:true,showControls:function(a){var c=this;a=typeof a=="undefined"||
a;if(!c.controlsAreVisible){if(a){c.controls.css("visibility","visible").stop(true,true).fadeIn(200,function(){c.controlsAreVisible=true});c.container.find(".mejs-control").css("visibility","visible").stop(true,true).fadeIn(200,function(){c.controlsAreVisible=true})}else{c.controls.css("visibility","visible").css("display","block");c.container.find(".mejs-control").css("visibility","visible").css("display","block");c.controlsAreVisible=true}c.setControlsSize()}},hideControls:function(a){var c=this;
a=typeof a=="undefined"||a;if(c.controlsAreVisible)if(a){c.controls.stop(true,true).fadeOut(200,function(){f(this).css("visibility","hidden").css("display","block");c.controlsAreVisible=false});c.container.find(".mejs-control").stop(true,true).fadeOut(200,function(){f(this).css("visibility","hidden").css("display","block")})}else{c.controls.css("visibility","hidden").css("display","block");c.container.find(".mejs-control").css("visibility","hidden").css("display","block");c.controlsAreVisible=false}},
controlsTimer:null,startControlsTimer:function(a){var c=this;a=typeof a!="undefined"?a:500;c.killControlsTimer("start");c.controlsTimer=setTimeout(function(){c.hideControls();c.killControlsTimer("hide")},a)},killControlsTimer:function(){if(this.controlsTimer!==null){clearTimeout(this.controlsTimer);delete this.controlsTimer;this.controlsTimer=null}},controlsEnabled:true,disableControls:function(){this.killControlsTimer();this.hideControls(false);this.controlsEnabled=false},enableControls:function(){this.showControls(false);
this.controlsEnabled=true},meReady:function(a,c){var b=this,d=mejs.MediaFeatures,e=c.getAttribute("autoplay");e=!(typeof e=="undefined"||e===null||e==="false");var h;if(!b.created){b.created=true;b.media=a;b.domNode=c;if(!(d.isAndroid&&b.options.AndroidUseNativeControls)&&!(d.isiPad&&b.options.iPadUseNativeControls)&&!(d.isiPhone&&b.options.iPhoneUseNativeControls)){b.buildposter(b,b.controls,b.layers,b.media);b.buildoverlays(b,b.controls,b.layers,b.media);b.findTracks();for(h in b.options.features){d=
b.options.features[h];if(b["build"+d])try{b["build"+d](b,b.controls,b.layers,b.media)}catch(j){}}b.container.trigger("controlsready");b.setPlayerSize(b.width,b.height);b.setControlsSize();if(b.isVideo){b.media.pluginType=="native"?b.$media.click(function(){a.paused?a.play():a.pause()}):f(b.media.pluginElement).click(function(){a.paused?a.play():a.pause()});b.container.bind("mouseenter mouseover",function(){if(b.controlsEnabled)if(!b.options.alwaysShowControls){b.killControlsTimer("enter");b.showControls();
b.startControlsTimer(2500)}}).bind("mousemove",function(){if(b.controlsEnabled){b.controlsAreVisible||b.showControls();b.startControlsTimer(2500)}}).bind("mouseleave",function(){b.controlsEnabled&&!b.media.paused&&!b.options.alwaysShowControls&&b.startControlsTimer(1E3)});e&&!b.options.alwaysShowControls&&b.hideControls();b.options.enableAutosize&&b.media.addEventListener("loadedmetadata",function(i){if(b.options.videoHeight<=0&&b.domNode.getAttribute("height")===null&&!isNaN(i.target.videoHeight)){b.setPlayerSize(i.target.videoWidth,
i.target.videoHeight);b.setControlsSize();b.media.setVideoSize(i.target.videoWidth,i.target.videoHeight)}},false)}b.media.addEventListener("ended",function(){b.media.setCurrentTime(0);b.media.pause();b.setProgressRail&&b.setProgressRail();b.setCurrentRail&&b.setCurrentRail();if(b.options.loop)b.media.play();else!b.options.alwaysShowControls&&b.controlsEnabled&&b.showControls()},true);b.media.addEventListener("loadedmetadata",function(){b.updateDuration&&b.updateDuration();b.updateCurrent&&b.updateCurrent();
if(!b.isFullScreen){b.setPlayerSize(b.width,b.height);b.setControlsSize()}},true);setTimeout(function(){b.setPlayerSize(b.width,b.height);b.setControlsSize()},50);f(window).resize(function(){b.isFullScreen||mejs.MediaFeatures.hasTrueNativeFullScreen&&document.webkitIsFullScreen||b.setPlayerSize(b.width,b.height);b.setControlsSize()})}if(e&&a.pluginType=="native"){a.load();a.play()}b.options.success&&b.options.success(b.media,b.domNode,b)}},handleError:function(a){this.controls.hide();this.options.error&&
this.options.error(a)},setPlayerSize:function(){if(this.height.toString().indexOf("%")>0){var a=this.media.videoWidth&&this.media.videoWidth>0?this.media.videoWidth:this.options.defaultVideoWidth,c=this.media.videoHeight&&this.media.videoHeight>0?this.media.videoHeight:this.options.defaultVideoHeight,b=this.container.parent().width();a=parseInt(b*c/a,10);if(this.container.parent()[0].tagName.toLowerCase()==="body"){b=f(window).width();a=f(window).height()}this.container.width(b).height(a);this.$media.width("100%").height("100%");
this.container.find("object embed").width("100%").height("100%");this.media.setVideoSize&&this.media.setVideoSize(b,a);this.layers.children(".mejs-layer").width("100%").height("100%")}else{this.container.width(this.width).height(this.height);this.layers.children(".mejs-layer").width(this.width).height(this.height)}},setControlsSize:function(){var a=0,c=0,b=this.controls.find(".mejs-time-rail"),d=this.controls.find(".mejs-time-total");this.controls.find(".mejs-time-current");this.controls.find(".mejs-time-loaded");
others=b.siblings();others.each(function(){if(f(this).css("position")!="absolute")a+=f(this).outerWidth(true)});c=this.controls.width()-a-(b.outerWidth(true)-b.outerWidth(false));b.width(c);d.width(c-(d.outerWidth(true)-d.width()));this.setProgressRail&&this.setProgressRail();this.setCurrentRail&&this.setCurrentRail()},buildposter:function(a,c,b,d){var e=f('<div class="mejs-poster mejs-layer"></div>').appendTo(b);c=a.$media.attr("poster");if(a.options.poster!=="")c=a.options.poster;c!==""&&c!=null?
this.setPoster(c):e.hide();d.addEventListener("play",function(){e.hide()},false)},setPoster:function(a){var c=this.container.find(".mejs-poster"),b=c.find("img");if(b.length==0)b=f('<img width="100%" height="100%" />').appendTo(c);b.attr("src",a)},buildoverlays:function(a,c,b,d){if(a.isVideo){var e=f('<div class="mejs-overlay mejs-layer"><div class="mejs-overlay-loading"><span></span></div></div>').hide().appendTo(b),h=f('<div class="mejs-overlay mejs-layer"><div class="mejs-overlay-error"></div></div>').hide().appendTo(b),
j=f('<div class="mejs-overlay mejs-layer mejs-overlay-play"><div class="mejs-overlay-button"></div></div>').appendTo(b).click(function(){d.paused?d.play():d.pause()});d.addEventListener("play",function(){j.hide();e.hide();h.hide()},false);d.addEventListener("playing",function(){j.hide();e.hide();h.hide()},false);d.addEventListener("pause",function(){mejs.MediaFeatures.isiPhone||j.show()},false);d.addEventListener("waiting",function(){e.show()},false);d.addEventListener("loadeddata",function(){e.show()},
false);d.addEventListener("canplay",function(){e.hide()},false);d.addEventListener("error",function(){e.hide();h.show();h.find("mejs-overlay-error").html("Error loading this resource")},false)}},findTracks:function(){var a=this,c=a.$media.find("track");a.tracks=[];c.each(function(){a.tracks.push({srclang:f(this).attr("srclang").toLowerCase(),src:f(this).attr("src"),kind:f(this).attr("kind"),entries:[],isLoaded:false})})},changeSkin:function(a){this.container[0].className="mejs-container "+a;this.setPlayerSize();
this.setControlsSize()},play:function(){this.media.play()},pause:function(){this.media.pause()},load:function(){this.media.load()},setMuted:function(a){this.media.setMuted(a)},setCurrentTime:function(a){this.media.setCurrentTime(a)},getCurrentTime:function(){return this.media.currentTime},setVolume:function(a){this.media.setVolume(a)},getVolume:function(){return this.media.volume},setSrc:function(a){this.media.setSrc(a)}};if(typeof jQuery!="undefined")jQuery.fn.mediaelementplayer=function(a){return this.each(function(){new mejs.MediaElementPlayer(this,
a)})};window.MediaElementPlayer=mejs.MediaElementPlayer})(mejs.$);
(function(f){f.extend(mejs.MepDefaults,{playpauseText:"Play/Pause"});f.extend(MediaElementPlayer.prototype,{buildplaypause:function(a,c,b,d){var e=f('<div class="mejs-button mejs-playpause-button mejs-play" ><button type="button" aria-controls="'+this.id+'" title="'+this.options.playpauseText+'"></button></div>').appendTo(c).click(function(h){h.preventDefault();d.paused?d.play():d.pause();return false});d.addEventListener("play",function(){e.removeClass("mejs-play").addClass("mejs-pause")},false);
d.addEventListener("playing",function(){e.removeClass("mejs-play").addClass("mejs-pause")},false);d.addEventListener("pause",function(){e.removeClass("mejs-pause").addClass("mejs-play")},false);d.addEventListener("paused",function(){e.removeClass("mejs-pause").addClass("mejs-play")},false)}})})(mejs.$);
(function(f){f.extend(mejs.MepDefaults,{stopText:"Stop"});f.extend(MediaElementPlayer.prototype,{buildstop:function(a,c,b,d){f('<div class="mejs-button mejs-stop-button mejs-stop"><button type="button" aria-controls="'+this.id+'" title="'+this.options.stopText+"></button></div>").appendTo(c).click(function(){d.paused||d.pause();if(d.currentTime>0){d.setCurrentTime(0);c.find(".mejs-time-current").width("0px");c.find(".mejs-time-handle").css("left","0px");c.find(".mejs-time-float-current").html(mejs.Utility.secondsToTimeCode(0));
c.find(".mejs-currenttime").html(mejs.Utility.secondsToTimeCode(0));b.find(".mejs-poster").show()}})}})})(mejs.$);
(function(f){f.extend(MediaElementPlayer.prototype,{buildprogress:function(a,c,b,d){f('<div class="mejs-time-rail"><span class="mejs-time-total"><span class="mejs-time-loaded"></span><span class="mejs-time-current"></span><span class="mejs-time-handle"></span><span class="mejs-time-float"><span class="mejs-time-float-current">00:00</span><span class="mejs-time-float-corner"></span></span></span></div>').appendTo(c);var e=c.find(".mejs-time-total");b=c.find(".mejs-time-loaded");var h=c.find(".mejs-time-current"),
j=c.find(".mejs-time-handle"),i=c.find(".mejs-time-float"),k=c.find(".mejs-time-float-current"),n=function(g){g=g.pageX;var m=e.offset(),q=e.outerWidth(),o=0;o=0;if(g>m.left&&g<=q+m.left&&d.duration){o=(g-m.left)/q;o=o<=0.02?0:o*d.duration;l&&d.setCurrentTime(o);i.css("left",g-m.left);k.html(mejs.Utility.secondsToTimeCode(o))}},l=false,r=false;e.bind("mousedown",function(g){if(g.which===1){l=true;n(g);return false}});c.find(".mejs-time-total").bind("mouseenter",function(){r=true}).bind("mouseleave",
function(){r=false});f(document).bind("mouseup",function(){l=false}).bind("mousemove",function(g){if(l||r)n(g)});d.addEventListener("progress",function(g){a.setProgressRail(g);a.setCurrentRail(g)},false);d.addEventListener("timeupdate",function(g){a.setProgressRail(g);a.setCurrentRail(g)},false);this.loaded=b;this.total=e;this.current=h;this.handle=j},setProgressRail:function(a){var c=a!=undefined?a.target:this.media,b=null;if(c&&c.buffered&&c.buffered.length>0&&c.buffered.end&&c.duration)b=c.buffered.end(0)/
c.duration;else if(c&&c.bytesTotal!=undefined&&c.bytesTotal>0&&c.bufferedBytes!=undefined)b=c.bufferedBytes/c.bytesTotal;else if(a&&a.lengthComputable&&a.total!=0)b=a.loaded/a.total;if(b!==null){b=Math.min(1,Math.max(0,b));this.loaded&&this.total&&this.loaded.width(this.total.width()*b)}},setCurrentRail:function(){if(this.media.currentTime!=undefined&&this.media.duration)if(this.total&&this.handle){var a=this.total.width()*this.media.currentTime/this.media.duration,c=a-this.handle.outerWidth(true)/
2;this.current.width(a);this.handle.css("left",c)}}})})(mejs.$);
(function(f){f.extend(mejs.MepDefaults,{duration:-1});f.extend(MediaElementPlayer.prototype,{buildcurrent:function(a,c,b,d){f('<div class="mejs-time"><span class="mejs-currenttime">'+(a.options.alwaysShowHours?"00:":"")+(a.options.showTimecodeFrameCount?"00:00:00":"00:00")+"</span></div>").appendTo(c);this.currenttime=this.controls.find(".mejs-currenttime");d.addEventListener("timeupdate",function(){a.updateCurrent()},false)},buildduration:function(a,c,b,d){if(c.children().last().find(".mejs-currenttime").length>
0)f(' <span> | </span> <span class="mejs-duration">'+(this.options.duration>0?mejs.Utility.secondsToTimeCode(this.options.duration,this.options.alwaysShowHours||this.media.duration>3600,this.options.showTimecodeFrameCount,this.options.framesPerSecond||25):(a.options.alwaysShowHours?"00:":"")+(a.options.showTimecodeFrameCount?"00:00:00":"00:00"))+"</span>").appendTo(c.find(".mejs-time"));else{c.find(".mejs-currenttime").parent().addClass("mejs-currenttime-container");f('<div class="mejs-time mejs-duration-container"><span class="mejs-duration">'+
(this.options.duration>0?mejs.Utility.secondsToTimeCode(this.options.duration,this.options.alwaysShowHours||this.media.duration>3600,this.options.showTimecodeFrameCount,this.options.framesPerSecond||25):(a.options.alwaysShowHours?"00:":"")+(a.options.showTimecodeFrameCount?"00:00:00":"00:00"))+"</span></div>").appendTo(c)}this.durationD=this.controls.find(".mejs-duration");d.addEventListener("timeupdate",function(){a.updateDuration()},false)},updateCurrent:function(){if(this.currenttime)this.currenttime.html(mejs.Utility.secondsToTimeCode(this.media.currentTime,
this.options.alwaysShowHours||this.media.duration>3600,this.options.showTimecodeFrameCount,this.options.framesPerSecond||25))},updateDuration:function(){if(this.media.duration&&this.durationD)this.durationD.html(mejs.Utility.secondsToTimeCode(this.media.duration,this.options.alwaysShowHours,this.options.showTimecodeFrameCount,this.options.framesPerSecond||25))}})})(mejs.$);
(function(f){f.extend(mejs.MepDefaults,{muteText:"Mute Toggle"});f.extend(MediaElementPlayer.prototype,{buildvolume:function(a,c,b,d){var e=f('<div class="mejs-button mejs-volume-button mejs-mute"><button type="button" aria-controls="'+this.id+'" title="'+this.options.muteText+'"></button><div class="mejs-volume-slider"><div class="mejs-volume-total"></div><div class="mejs-volume-current"></div><div class="mejs-volume-handle"></div></div></div>').appendTo(c),h=e.find(".mejs-volume-slider"),j=e.find(".mejs-volume-total"),
i=e.find(".mejs-volume-current"),k=e.find(".mejs-volume-handle"),n=function(g){if(h.is(":visible")){var m=j.height(),q=j.position();g=m-m*g;k.css("top",q.top+g-k.height()/2);i.height(m-g);i.css("top",q.top+g)}else{h.show();n(g);h.hide()}},l=function(g){var m=j.height(),q=j.offset(),o=parseInt(j.css("top").replace(/px/,""),10);g=g.pageY-q.top;var p=(m-g)/m;if(q.top!=0){p=Math.max(0,p);p=Math.min(p,1);if(g<0)g=0;else if(g>m)g=m;k.css("top",g-k.height()/2+o);i.height(m-g);i.css("top",g+o);if(p==0){d.setMuted(true);
e.removeClass("mejs-mute").addClass("mejs-unmute")}else{d.setMuted(false);e.removeClass("mejs-unmute").addClass("mejs-mute")}p=Math.max(0,p);p=Math.min(p,1);d.setVolume(p)}},r=false;e.hover(function(){h.show()},function(){h.hide()});h.bind("mousedown",function(g){l(g);r=true;return false});f(document).bind("mouseup",function(){r=false}).bind("mousemove",function(g){r&&l(g)});e.find("button").click(function(){d.setMuted(!d.muted)});d.addEventListener("volumechange",function(g){if(!r)if(d.muted){n(0);
e.removeClass("mejs-mute").addClass("mejs-unmute")}else{n(g.target.volume);e.removeClass("mejs-unmute").addClass("mejs-mute")}},true);n(a.options.startVolume);d.pluginType==="native"&&d.setVolume(a.options.startVolume)}})})(mejs.$);
(function(f){f.extend(mejs.MepDefaults,{forcePluginFullScreen:false,newWindowCallback:function(){return""},fullscreenText:"Fullscreen"});f.extend(MediaElementPlayer.prototype,{isFullScreen:false,docStyleOverflow:null,isInIframe:false,buildfullscreen:function(a,c){if(a.isVideo){a.isInIframe=window.location!=window.parent.location;mejs.MediaFeatures.hasTrueNativeFullScreen&&a.container.bind("webkitfullscreenchange",function(){mejs.MediaFeatures.isFullScreen()?a.setControlsSize():a.exitFullScreen()});
var b=this,d=f('<div class="mejs-button mejs-fullscreen-button"><button type="button" aria-controls="'+b.id+'" title="'+b.options.fullscreenText+'"></button></div>').appendTo(c).click(function(){mejs.MediaFeatures.hasTrueNativeFullScreen&&mejs.MediaFeatures.isFullScreen()||a.isFullScreen?a.exitFullScreen():a.enterFullScreen()});a.fullscreenBtn=d;f(document).bind("keydown",function(e){if((mejs.MediaFeatures.hasTrueNativeFullScreen&&mejs.MediaFeatures.isFullScreen()||b.isFullScreen)&&e.keyCode==27)a.exitFullScreen()})}},
enterFullScreen:function(){var a=this;if(a.media.pluginType!=="native"&&(mejs.MediaFeatures.isGecko||a.options.forcePluginFullScreen))a.media.setFullscreen(true);else{docStyleOverflow=document.documentElement.style.overflow;document.documentElement.style.overflow="hidden";normalHeight=a.container.height();normalWidth=a.container.width();if(mejs.MediaFeatures.hasTrueNativeFullScreen)mejs.MediaFeatures.requestFullScreen(a.container[0]);else if(mejs.MediaFeatures.hasSemiNativeFullScreen){a.media.webkitEnterFullscreen();
return}if(a.isInIframe&&a.options.newWindowUrl!==""){a.pause();var c=a.options.newWindowCallback(this);c!==""&&window.open(c,a.id,"top=0,left=0,width="+screen.availWidth+",height="+screen.availHeight+",resizable=yes,scrollbars=no,status=no,toolbar=no")}else{a.container.addClass("mejs-container-fullscreen").width("100%").height("100%");mejs.MediaFeatures.hasTrueNativeFullScreen&&setTimeout(function(){a.container.css({width:"100%",height:"100%"})},500);if(a.pluginType==="native")a.$media.width("100%").height("100%");
else{a.container.find("object embed").width("100%").height("100%");a.media.setVideoSize(f(window).width(),f(window).height())}a.layers.children("div").width("100%").height("100%");a.fullscreenBtn&&a.fullscreenBtn.removeClass("mejs-fullscreen").addClass("mejs-unfullscreen");a.setControlsSize();a.isFullScreen=true}}},exitFullScreen:function(){if(this.media.pluginType!=="native"&&mejs.MediaFeatures.isFirefox)this.media.setFullscreen(false);else{if(mejs.MediaFeatures.hasTrueNativeFullScreen&&(mejs.MediaFeatures.isFullScreen()||
this.isFullScreen))mejs.MediaFeatures.cancelFullScreen();document.documentElement.style.overflow=docStyleOverflow;this.container.removeClass("mejs-container-fullscreen").width(normalWidth).height(normalHeight);if(this.pluginType==="native")this.$media.width(normalWidth).height(normalHeight);else{this.container.find("object embed").width(normalWidth).height(normalHeight);this.media.setVideoSize(normalWidth,normalHeight)}this.layers.children("div").width(normalWidth).height(normalHeight);this.fullscreenBtn.removeClass("mejs-unfullscreen").addClass("mejs-fullscreen");
this.setControlsSize();this.isFullScreen=false}}})})(mejs.$);
(function(f){f.extend(mejs.MepDefaults,{startLanguage:"",translations:[],translationSelector:false,googleApiKey:"",tracksText:"Captions/Subtitles"});f.extend(MediaElementPlayer.prototype,{hasChapters:false,buildtracks:function(a,c,b,d){if(a.isVideo)if(a.tracks.length!=0){var e,h="";a.chapters=f('<div class="mejs-chapters mejs-layer"></div>').prependTo(b).hide();a.captions=f('<div class="mejs-captions-layer mejs-layer"><div class="mejs-captions-position"><span class="mejs-captions-text"></span></div></div>').prependTo(b).hide();a.captionsText=
a.captions.find(".mejs-captions-text");a.captionsButton=f('<div class="mejs-button mejs-captions-button"><button type="button" aria-controls="'+this.id+'" title="'+this.options.tracksText+'"></button><div class="mejs-captions-selector"><ul><li><input type="radio" name="'+a.id+'_captions" id="'+a.id+'_captions_none" value="none" checked="checked" /><label for="'+a.id+'_captions_none">None</label></li></ul></div></div>').appendTo(c).hover(function(){f(this).find(".mejs-captions-selector").css("visibility",
"visible")},function(){f(this).find(".mejs-captions-selector").css("visibility","hidden")}).delegate("input[type=radio]","click",function(){lang=this.value;if(lang=="none")a.selectedTrack=null;else for(e=0;e<a.tracks.length;e++)if(a.tracks[e].srclang==lang){a.selectedTrack=a.tracks[e];a.captions.attr("lang",a.selectedTrack.srclang);a.displayCaptions();break}});a.options.alwaysShowControls?a.container.find(".mejs-captions-position").addClass("mejs-captions-position-hover"):a.container.bind("mouseenter",
function(){a.container.find(".mejs-captions-position").addClass("mejs-captions-position-hover")}).bind("mouseleave",function(){d.paused||a.container.find(".mejs-captions-position").removeClass("mejs-captions-position-hover")});a.trackToLoad=-1;a.selectedTrack=null;a.isLoadingTrack=false;if(a.tracks.length>0&&a.options.translations.length>0)for(e=0;e<a.options.translations.length;e++)a.tracks.push({srclang:a.options.translations[e].toLowerCase(),src:null,kind:"subtitles",entries:[],isLoaded:false,
isTranslation:true});for(e=0;e<a.tracks.length;e++)a.tracks[e].kind=="subtitles"&&a.addTrackButton(a.tracks[e].srclang,a.tracks[e].isTranslation);a.loadNextTrack();d.addEventListener("timeupdate",function(){a.displayCaptions()},false);d.addEventListener("loadedmetadata",function(){a.displayChapters()},false);a.container.hover(function(){if(a.hasChapters){a.chapters.css("visibility","visible");a.chapters.fadeIn(200)}},function(){a.hasChapters&&!d.paused&&a.chapters.fadeOut(200,function(){f(this).css("visibility",
"hidden");f(this).css("display","block")})});a.node.getAttribute("autoplay")!==null&&a.chapters.css("visibility","hidden");if(a.options.translationSelector){for(e in mejs.language.codes)h+='<option value="'+e+'">'+mejs.language.codes[e]+"</option>";a.container.find(".mejs-captions-selector ul").before(f('<select class="mejs-captions-translations"><option value="">--Add Translation--</option>'+h+"</select>"));a.container.find(".mejs-captions-translations").change(function(){lang=f(this).val();if(lang!=
""){a.tracks.push({srclang:lang,src:null,entries:[],isLoaded:false,isTranslation:true});if(!a.isLoadingTrack){a.trackToLoad--;a.addTrackButton(lang,true);a.options.startLanguage=lang;a.loadNextTrack()}}})}}},loadNextTrack:function(){this.trackToLoad++;if(this.trackToLoad<this.tracks.length){this.isLoadingTrack=true;this.loadTrack(this.trackToLoad)}else this.isLoadingTrack=false},loadTrack:function(a){var c=this,b=c.tracks[a],d=function(){b.isLoaded=true;c.enableTrackButton(b.srclang);c.loadNextTrack()};
b.isTranslation?mejs.TrackFormatParser.translateTrackText(c.tracks[0].entries,c.tracks[0].srclang,b.srclang,c.options.googleApiKey,function(e){b.entries=e;d()}):f.ajax({url:b.src,success:function(e){b.entries=mejs.TrackFormatParser.parse(e);d();b.kind=="chapters"&&c.media.duration>0&&c.drawChapters(b)},error:function(){c.loadNextTrack()}})},enableTrackButton:function(a){this.captionsButton.find("input[value="+a+"]").prop("disabled",false).siblings("label").html(mejs.language.codes[a]||a);this.options.startLanguage==
a&&f("#"+this.id+"_captions_"+a).click();this.adjustLanguageBox()},addTrackButton:function(a,c){var b=mejs.language.codes[a]||a;this.captionsButton.find("ul").append(f('<li><input type="radio" name="'+this.id+'_captions" id="'+this.id+"_captions_"+a+'" value="'+a+'" disabled="disabled" /><label for="'+this.id+"_captions_"+a+'">'+b+(c?" (translating)":" (loading)")+"</label></li>"));this.adjustLanguageBox();this.container.find(".mejs-captions-translations option[value="+a+"]").remove()},adjustLanguageBox:function(){this.captionsButton.find(".mejs-captions-selector").height(this.captionsButton.find(".mejs-captions-selector ul").outerHeight(true)+
this.captionsButton.find(".mejs-captions-translations").outerHeight(true))},displayCaptions:function(){if(typeof this.tracks!="undefined"){var a,c=this.selectedTrack;if(c!=null&&c.isLoaded)for(a=0;a<c.entries.times.length;a++)if(this.media.currentTime>=c.entries.times[a].start&&this.media.currentTime<=c.entries.times[a].stop){this.captionsText.html(c.entries.text[a]);this.captions.show();return}this.captions.hide()}},displayChapters:function(){var a;for(a=0;a<this.tracks.length;a++)if(this.tracks[a].kind==
"chapters"&&this.tracks[a].isLoaded){this.drawChapters(this.tracks[a]);this.hasChapters=true;break}},drawChapters:function(a){var c=this,b,d,e=d=0;c.chapters.empty();for(b=0;b<a.entries.times.length;b++){d=a.entries.times[b].stop-a.entries.times[b].start;d=Math.floor(d/c.media.duration*100);if(d+e>100||b==a.entries.times.length-1&&d+e<100)d=100-e;c.chapters.append(f('<div class="mejs-chapter" rel="'+a.entries.times[b].start+'" style="left: '+e.toString()+"%;width: "+d.toString()+'%;"><div class="mejs-chapter-block'+
(b==a.entries.times.length-1?" mejs-chapter-block-last":"")+'"><span class="ch-title">'+a.entries.text[b]+'</span><span class="ch-time">'+mejs.Utility.secondsToTimeCode(a.entries.times[b].start)+"&ndash;"+mejs.Utility.secondsToTimeCode(a.entries.times[b].stop)+"</span></div></div>"));e+=d}c.chapters.find("div.mejs-chapter").click(function(){c.media.setCurrentTime(parseFloat(f(this).attr("rel")));c.media.paused&&c.media.play()});c.chapters.show()}});mejs.language={codes:{af:"Afrikaans",sq:"Albanian",
ar:"Arabic",be:"Belarusian",bg:"Bulgarian",ca:"Catalan",zh:"Chinese","zh-cn":"Chinese Simplified","zh-tw":"Chinese Traditional",hr:"Croatian",cs:"Czech",da:"Danish",nl:"Dutch",en:"English",et:"Estonian",tl:"Filipino",fi:"Finnish",fr:"French",gl:"Galician",de:"German",el:"Greek",ht:"Haitian Creole",iw:"Hebrew",hi:"Hindi",hu:"Hungarian",is:"Icelandic",id:"Indonesian",ga:"Irish",it:"Italian",ja:"Japanese",ko:"Korean",lv:"Latvian",lt:"Lithuanian",mk:"Macedonian",ms:"Malay",mt:"Maltese",no:"Norwegian",
fa:"Persian",pl:"Polish",pt:"Portuguese",ro:"Romanian",ru:"Russian",sr:"Serbian",sk:"Slovak",sl:"Slovenian",es:"Spanish",sw:"Swahili",sv:"Swedish",tl:"Tagalog",th:"Thai",tr:"Turkish",uk:"Ukrainian",vi:"Vietnamese",cy:"Welsh",yi:"Yiddish"}};mejs.TrackFormatParser={pattern_identifier:/^([a-zA-z]+-)?[0-9]+$/,pattern_timecode:/^([0-9]{2}:[0-9]{2}:[0-9]{2}([,.][0-9]{1,3})?) --\> ([0-9]{2}:[0-9]{2}:[0-9]{2}([,.][0-9]{3})?)(.*)$/,split2:function(a,c){return a.split(c)},parse:function(a){var c=0;a=this.split2(a,
/\r?\n/);for(var b={text:[],times:[]},d,e;c<a.length;c++)if(this.pattern_identifier.exec(a[c])){c++;if((d=this.pattern_timecode.exec(a[c]))&&c<a.length){c++;e=a[c];for(c++;a[c]!==""&&c<a.length;){e=e+"\n"+a[c];c++}b.text.push(e);b.times.push({start:mejs.Utility.timeCodeToSeconds(d[1]),stop:mejs.Utility.timeCodeToSeconds(d[3]),settings:d[5]})}}return b},translateTrackText:function(a,c,b,d,e){var h={text:[],times:[]},j,i;this.translateText(a.text.join(" <a></a>"),c,b,d,function(k){j=k.split("<a></a>");
for(i=0;i<a.text.length;i++){h.text[i]=j[i];h.times[i]={start:a.times[i].start,stop:a.times[i].stop,settings:a.times[i].settings}}e(h)})},translateText:function(a,c,b,d,e){for(var h,j=[],i,k="",n=function(){if(j.length>0){i=j.shift();mejs.TrackFormatParser.translateChunk(i,c,b,d,function(l){if(l!="undefined")k+=l;n()})}else e(k)};a.length>0;)if(a.length>1E3){h=a.lastIndexOf(".",1E3);j.push(a.substring(0,h));a=a.substring(h+1)}else{j.push(a);a=""}n()},translateChunk:function(a,c,b,d,e){a={q:a,langpair:c+
"|"+b,v:"1.0"};if(d!==""&&d!==null)a.key=d;f.ajax({url:"https://ajax.googleapis.com/ajax/services/language/translate",data:a,type:"GET",dataType:"jsonp",success:function(h){e(h.responseData.translatedText)},error:function(){e(null)}})}};if("x\n\ny".split(/\n/gi).length!=3)mejs.TrackFormatParser.split2=function(a,c){var b=[],d="",e;for(e=0;e<a.length;e++){d+=a.substring(e,e+1);if(c.test(d)){b.push(d.replace(c,""));d=""}}b.push(d);return b}})(mejs.$);
(function(f){f.extend(mejs.MepDefaults,contextMenuItems=[{render:function(a){if(typeof a.enterFullScreen=="undefined")return null;return a.isFullScreen?"Turn off Fullscreen":"Go Fullscreen"},click:function(a){a.isFullScreen?a.exitFullScreen():a.enterFullScreen()}},{render:function(a){return a.media.muted?"Unmute":"Mute"},click:function(a){a.media.muted?a.setMuted(false):a.setMuted(true)}},{isSeparator:true},{render:function(){return"Download Video"},click:function(a){window.location.href=a.media.currentSrc}}]);
f.extend(MediaElementPlayer.prototype,{buildcontextmenu:function(a){a.contextMenu=f('<div class="mejs-contextmenu"></div>').appendTo(f("body")).hide();a.container.bind("contextmenu",function(c){if(a.isContextMenuEnabled){c.preventDefault();a.renderContextMenu(c.clientX-1,c.clientY-1);return false}});a.container.bind("click",function(){a.contextMenu.hide()});a.contextMenu.bind("mouseleave",function(){a.startContextMenuTimer()})},isContextMenuEnabled:true,enableContextMenu:function(){this.isContextMenuEnabled=
true},disableContextMenu:function(){this.isContextMenuEnabled=false},contextMenuTimeout:null,startContextMenuTimer:function(){var a=this;a.killContextMenuTimer();a.contextMenuTimer=setTimeout(function(){a.hideContextMenu();a.killContextMenuTimer()},750)},killContextMenuTimer:function(){var a=this.contextMenuTimer;if(a!=null){clearTimeout(a);delete a}},hideContextMenu:function(){this.contextMenu.hide()},renderContextMenu:function(a,c){for(var b=this,d="",e=b.options.contextMenuItems,h=0,j=e.length;h<
j;h++)if(e[h].isSeparator)d+='<div class="mejs-contextmenu-separator"></div>';else{var i=e[h].render(b);if(i!=null)d+='<div class="mejs-contextmenu-item" data-itemindex="'+h+'" id="element-'+Math.random()*1E6+'">'+i+"</div>"}b.contextMenu.empty().append(f(d)).css({top:c,left:a}).show();b.contextMenu.find(".mejs-contextmenu-item").each(function(){var k=f(this),n=parseInt(k.data("itemindex"),10),l=b.options.contextMenuItems[n];typeof l.show!="undefined"&&l.show(k,b);k.click(function(){typeof l.click!=
"undefined"&&l.click(b);b.contextMenu.hide()})});setTimeout(function(){b.killControlsTimer("rev3")},100)}})})(mejs.$);

