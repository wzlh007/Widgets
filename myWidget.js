document.write('<link href="custom.css" rel="stylesheet">');
document.write('<script src="jquery-1.11.3.min.js"></script>');
function myWidget(viewer,scene,ellipsoid)
{
	this.viewer = viewer;
	this.scene = scene;
	this.ellipsoid = ellipsoid;
	
	this.movePick = movePick;
	this.getcamera = getcamera;
	this.showScalebar = showScalebar;
	this.doCompass = doCompass;
	this.doNavi = doNavi;
	this.getStyle = getStyle;
	this.getNum = getNum;
	this.toRingRad = toRingRad;
	this.showlonlat = showlonlat;
	this.homeView = {destination:new Cesium.Cartesian3(2659517.6470542485, -20201042.105477437, 14326778.724919258),
	orientation:{heading:0,pitch:-1.5688445983144326,roll:0}};
	
	this.zoomRate = this.getcamera().carto.height/100;
	this.clickZoomIn = clickZoomIn;
	this.clickZoomOut = clickZoomOut;
}
	//经纬度高度获取
	function movePick()
	{
		document.write("<div class=\"cesium-toolbar2\" id=\"cameraView\"><span id=\"long\">经度：</span><span id=\"lat\"  style=\"padding-left: 10px;\">    \t纬度：</span><span id=\"height\"  style=\"padding-left: 10px;\">    \t高度：</span><span id=\"viewheight\"  style=\"padding-left: 10px;\">    \t视角高度：</span></div>\"");
		var scene = this.scene;
		var ellipsoid =this.ellipsoid;
		var terrainProvider = new Cesium.CesiumTerrainProvider({//无法获取terrainprovider
			url : '//assets.agi.com/stk-terrain/world'
		});
		var handler;
		handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
		handler.setInputAction(function(movement) {
			var cartesian = this.viewer.camera.pickEllipsoid(movement.endPosition, ellipsoid);
			var ray = this.viewer.camera.getPickRay(movement.endPosition);
			var position = scene.globe.pick(ray, scene);
			
			if (cartesian&&Cesium.defined(position)) {
				var cartographic = ellipsoid.cartesianToCartographic(cartesian);
				var positionCartographic = ellipsoid.cartesianToCartographic(position);
				var longitude = Cesium.Math.toDegrees(cartographic.longitude);
				var longitudeString = this.showlonlat(longitude,'lon');
				var latitude = Cesium.Math.toDegrees(cartographic.latitude);
				var latitudeString = this.showlonlat(latitude,'lat');
				var heightString = '';// = positionCartographic.height.toFixed(2);//cartographic.height.toFixed(2);
				
				var cameraheight0 = this.getcamera().carto.height;
				this.zoomRate = cameraheight0/100;
				var cameraheight = cameraheight0.toFixed(0);
				var positions =[positionCartographic];
				var promise = Cesium.sampleTerrain(terrainProvider, 9, positions);  
				promise.then(function() {
					var height=positions[0].height.toFixed(2);
					var heightString;
					if(height)
						heightString = height;
					else heightString =  "未定义";
					document.getElementById("height").innerHTML='\t'+"高度: "+heightString+'米';
				  }).otherwise(function(error){
					  //Display any errrors encountered while loading.
					  document.getElementById("height").innerHTML="	\t高度: 未定义";
				  });
				
				document.getElementById("long").innerHTML="经度: "+longitudeString;
				document.getElementById("lat").innerHTML="    \t纬度: "+latitudeString;
				document.getElementById("viewheight").innerHTML="    \t视角高度: "+cameraheight+'米';
				
			} else {
				document.getElementById("long").innerHTML="经度：";
				document.getElementById("lat").innerHTML="    \t纬度：";
				document.getElementById("height").innerHTML="    \t高度：";
				
			}
			//console.log(this.zoomRate);
		}, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
		
		handler.setInputAction(function() {
			var cameraheight0 = this.getcamera().carto.height;
			this.zoomRate = cameraheight0/100;
			var cameraheight = cameraheight0.toFixed(0);
			console.log(this.zoomRate);
			document.getElementById("viewheight").innerHTML="    \t视角高度: "+cameraheight+'米';
		}, Cesium.ScreenSpaceEventType.WHEEL);
		
		var cameraheight = this.getcamera().carto.height.toFixed(0);
		document.getElementById("viewheight").innerHTML="    \t视角高度: "+cameraheight+'米';
	}
//当前相机信息获取
	function getcamera()
	{
		var scene = this.scene;
		var destination = this.viewer.camera.position;//.toString();
		var carto = Cesium.Ellipsoid.WGS84.cartesianToCartographic(destination);
		var ray = new Cesium.Ray(destination,this.viewer.camera.direction);
		var raypoint = scene.globe.pick(ray, scene);
		var rayCarto = raypoint?(Cesium.Ellipsoid.WGS84.cartesianToCartographic(raypoint)):false;
		var orientation = 
		{heading : this.viewer.camera.heading,
		pitch : this.viewer.camera.pitch,
		roll : this.viewer.camera.roll};
		var mycamera={destination,carto,orientation,rayCarto};
		
		return mycamera;
	}
	//显示比例尺
	function showScalebar(){
		var cesiumContainer = document.getElementById("cesiumContainer");
		var barHTML="<svg width=\"100px\" height=\"20px\" version=\"1.1\"\
			xmlns=\"http://www.w3.org/2000/svg\">\
			<line x1=\"5\" y1=\"20\" x2=\"95\" y2=\"20\"\
			style=\"stroke:rgb(255,255,255);stroke-width:2\"/>\
			<line x1=\"5\" y1=\"5\" x2=\"5\" y2=\"20\"\
			style=\"stroke:rgb(255,255,255);stroke-width:2\"/>\
			<line x1=\"95\" y1=\"5\" x2=\"95\" y2=\"20\"\
			style=\"stroke:rgb(255,255,255);stroke-width:2\"/></svg>"
		var scaleContainer = document.createElement('div');
		scaleContainer.className = 'scalebar';
		scaleContainer.setAttribute('id','scaleContainer');
		scaleContainer.setAttribute('style','width:100px');
		cesiumContainer.appendChild(scaleContainer);
		document.getElementById("scaleContainer").innerHTML=barHTML;
		
		var scaletext = document.createElement('div');
		scaletext.className = 'scalebar';
		scaletext.setAttribute('id','scaletext');
		scaletext.setAttribute('style','width:100px;height:22px;background:rgba(255,255,255,0);');
		cesiumContainer.appendChild(scaletext);
		document.getElementById("scaletext").innerHTML='<div id=\"scaletext\" style=\"display: inline-block;\">比例尺</div>';
		
		var labelmove=false;
		var handler;
		var cesiumwidth = document.getElementById("cesiumContainer").clientWidth;
		var cesiumheight = document.getElementById("cesiumContainer").clientHeight;
		var scaleConWidth = document.getElementById("scaleContainer").clientWidth;
		var scaleConHeight = document.getElementById("scaleContainer").clientHeight;
		var windowleft =new Cesium.Cartesian2(cesiumwidth-scaleConWidth-10-10-1-95,cesiumheight-80-7-1);
		var windowright =new Cesium.Cartesian2(cesiumwidth-scaleConWidth-10-1-5-10,cesiumheight-80-7-1);
		var scaleString = '';
		
		handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
		this.viewer.camera.moveStart.addEventListener(function() {
			labelmove=true;
		});

		this.viewer.camera.moveEnd.addEventListener(function() {
			labelmove=false;
		});
		
		handler.setInputAction(function(movement) {
		if(labelmove==true){
			var ray1 = this.viewer.camera.getPickRay(windowleft);
			var position1 = this.scene.globe.pick(ray1, this.scene);
			var ray2 = this.viewer.camera.getPickRay(windowright);
			var position2 = this.scene.globe.pick(ray2, this.scene);
			if(position1&&position2){
				var distance = Cesium.Cartesian3.distance(position1,position2)
				if(distance>3000)
				document.getElementById("scaletext").innerHTML= (distance/1000).toFixed(0)+"公里";
				else document.getElementById("scaletext").innerHTML= distance.toFixed(0)+"米";
			}
			else document.getElementById("scaletext").innerHTML="比例尺";

			}

		}, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
		
		handler.setInputAction(function() {
		if(labelmove==true){
			var ray1 = this.viewer.camera.getPickRay(windowleft);
			var position1 = this.scene.globe.pick(ray1, this.scene);
			var ray2 = this.viewer.camera.getPickRay(windowright);
			var position2 = this.scene.globe.pick(ray2, this.scene);
			if(position1&&position2){
				var distance = Cesium.Cartesian3.distance(position1,position2)
				if(distance>3000)
				document.getElementById("scaletext").innerHTML= (distance/1000).toFixed(0)+"公里";
				else document.getElementById("scaletext").innerHTML= distance.toFixed(0)+"米";
			}
			else document.getElementById("scaletext").innerHTML="比例尺";

			}

		}, Cesium.ScreenSpaceEventType.WHEEL);
		
	  }
	//指北针罗盘
	function doCompass()
	{
		var compassHTML='<div class="compass" id="compass" title="Drag outer ring: rotate view.\
	Drag inner gyroscope: free orbit.\
	Double-click: reset view.\
	TIP: You can also free orbit by holding the CTRL key and dragging the map.">\
		<div class="compass-outer-ring-background"></div>\
		<div class="compass-rotation-marker" style="display:none;"><svg class="cesium-svgPath-svg" width="145" height="145" viewBox="0 0 145 145"><path d="M 72.46875,22.03125 C 59.505873,22.050338 46.521615,27.004287 36.6875,36.875 L 47.84375,47.96875 C 61.521556,34.240041 83.442603,34.227389 97.125,47.90625 l 11.125,-11.125 C 98.401629,26.935424 85.431627,22.012162 72.46875,22.03125 z"></path></svg></div>\
		<div class="compass-outer-ring" ><svg class="cesium-svgPath-svg" width="145" height="145" viewBox="0 0 145 145"><path d="m 66.5625,0 0,15.15625 3.71875,0 0,-10.40625 5.5,10.40625 4.375,0 0,-15.15625 -3.71875,0 0,10.40625 L 70.9375,0 66.5625,0 z M 72.5,20.21875 c -28.867432,0 -52.28125,23.407738 -52.28125,52.28125 0,28.87351 23.413818,52.3125 52.28125,52.3125 28.86743,0 52.28125,-23.43899 52.28125,-52.3125 0,-28.873512 -23.41382,-52.28125 -52.28125,-52.28125 z m 0,1.75 c 13.842515,0 26.368948,5.558092 35.5,14.5625 l -11.03125,11 0.625,0.625 11.03125,-11 c 8.9199,9.108762 14.4375,21.579143 14.4375,35.34375 0,13.764606 -5.5176,26.22729 -14.4375,35.34375 l -11.03125,-11 -0.625,0.625 11.03125,11 c -9.130866,9.01087 -21.658601,14.59375 -35.5,14.59375 -13.801622,0 -26.321058,-5.53481 -35.4375,-14.5 l 11.125,-11.09375 c 6.277989,6.12179 14.857796,9.90625 24.3125,9.90625 19.241896,0 34.875,-15.629154 34.875,-34.875 0,-19.245847 -15.633104,-34.84375 -34.875,-34.84375 -9.454704,0 -18.034511,3.760884 -24.3125,9.875 L 37.0625,36.4375 C 46.179178,27.478444 58.696991,21.96875 72.5,21.96875 z m -0.875,0.84375 0,13.9375 1.75,0 0,-13.9375 -1.75,0 z M 36.46875,37.0625 47.5625,48.15625 C 41.429794,54.436565 37.65625,63.027539 37.65625,72.5 c 0,9.472461 3.773544,18.055746 9.90625,24.34375 L 36.46875,107.9375 c -8.96721,-9.1247 -14.5,-21.624886 -14.5,-35.4375 0,-13.812615 5.53279,-26.320526 14.5,-35.4375 z M 72.5,39.40625 c 18.297686,0 33.125,14.791695 33.125,33.09375 0,18.302054 -14.827314,33.125 -33.125,33.125 -18.297687,0 -33.09375,-14.822946 -33.09375,-33.125 0,-18.302056 14.796063,-33.09375 33.09375,-33.09375 z M 22.84375,71.625 l 0,1.75 13.96875,0 0,-1.75 -13.96875,0 z m 85.5625,0 0,1.75 14,0 0,-1.75 -14,0 z M 71.75,108.25 l 0,13.9375 1.71875,0 0,-13.9375 -1.71875,0 z"></path><path d="m 66.5625,0 0,15.15625 3.71875,0 0,-10.40625 5.5,10.40625 4.375,0 0,-15.15625 -3.71875,0 0,10.40625 L 70.9375,0 66.5625,0 z" style="fill:white;stroke:black;"></path></svg></div>\
		<div class="compass-gyro-background"></div>\
		<div class="compass-gyro"><svg class="cesium-svgPath-svg" width="145" height="145" viewBox="0 0 145 145"><path d="m 72.71875,54.375 c -0.476702,0 -0.908208,0.245402 -1.21875,0.5625 -0.310542,0.317098 -0.551189,0.701933 -0.78125,1.1875 -0.172018,0.363062 -0.319101,0.791709 -0.46875,1.25 -6.91615,1.075544 -12.313231,6.656514 -13,13.625 -0.327516,0.117495 -0.661877,0.244642 -0.9375,0.375 -0.485434,0.22959 -0.901634,0.471239 -1.21875,0.78125 -0.317116,0.310011 -0.5625,0.742111 -0.5625,1.21875 l 0.03125,0 c 0,0.476639 0.245384,0.877489 0.5625,1.1875 0.317116,0.310011 0.702066,0.58291 1.1875,0.8125 0.35554,0.168155 0.771616,0.32165 1.21875,0.46875 1.370803,6.10004 6.420817,10.834127 12.71875,11.8125 0.146999,0.447079 0.30025,0.863113 0.46875,1.21875 0.230061,0.485567 0.470708,0.870402 0.78125,1.1875 0.310542,0.317098 0.742048,0.5625 1.21875,0.5625 0.476702,0 0.876958,-0.245402 1.1875,-0.5625 0.310542,-0.317098 0.582439,-0.701933 0.8125,-1.1875 0.172018,-0.363062 0.319101,-0.791709 0.46875,-1.25 6.249045,-1.017063 11.256351,-5.7184 12.625,-11.78125 0.447134,-0.1471 0.86321,-0.300595 1.21875,-0.46875 0.485434,-0.22959 0.901633,-0.502489 1.21875,-0.8125 0.317117,-0.310011 0.5625,-0.710861 0.5625,-1.1875 l -0.03125,0 c 0,-0.476639 -0.245383,-0.908739 -0.5625,-1.21875 C 89.901633,71.846239 89.516684,71.60459 89.03125,71.375 88.755626,71.244642 88.456123,71.117495 88.125,71 87.439949,64.078341 82.072807,58.503735 75.21875,57.375 c -0.15044,-0.461669 -0.326927,-0.884711 -0.5,-1.25 -0.230061,-0.485567 -0.501958,-0.870402 -0.8125,-1.1875 -0.310542,-0.317098 -0.710798,-0.5625 -1.1875,-0.5625 z m -0.0625,1.40625 c 0.03595,-0.01283 0.05968,0 0.0625,0 0.0056,0 0.04321,-0.02233 0.1875,0.125 0.144288,0.147334 0.34336,0.447188 0.53125,0.84375 0.06385,0.134761 0.123901,0.309578 0.1875,0.46875 -0.320353,-0.01957 -0.643524,-0.0625 -0.96875,-0.0625 -0.289073,0 -0.558569,0.04702 -0.84375,0.0625 C 71.8761,57.059578 71.936151,56.884761 72,56.75 c 0.18789,-0.396562 0.355712,-0.696416 0.5,-0.84375 0.07214,-0.07367 0.120304,-0.112167 0.15625,-0.125 z m 0,2.40625 c 0.448007,0 0.906196,0.05436 1.34375,0.09375 0.177011,0.592256 0.347655,1.271044 0.5,2.03125 0.475097,2.370753 0.807525,5.463852 0.9375,8.9375 -0.906869,-0.02852 -1.834463,-0.0625 -2.78125,-0.0625 -0.92298,0 -1.802327,0.03537 -2.6875,0.0625 0.138529,-3.473648 0.493653,-6.566747 0.96875,-8.9375 0.154684,-0.771878 0.320019,-1.463985 0.5,-2.0625 0.405568,-0.03377 0.804291,-0.0625 1.21875,-0.0625 z m -2.71875,0.28125 c -0.129732,0.498888 -0.259782,0.987558 -0.375,1.5625 -0.498513,2.487595 -0.838088,5.693299 -0.96875,9.25 -3.21363,0.15162 -6.119596,0.480068 -8.40625,0.9375 -0.682394,0.136509 -1.275579,0.279657 -1.84375,0.4375 0.799068,-6.135482 5.504716,-11.036454 11.59375,-12.1875 z M 75.5,58.5 c 6.043169,1.18408 10.705093,6.052712 11.5,12.15625 -0.569435,-0.155806 -1.200273,-0.302525 -1.875,-0.4375 -2.262525,-0.452605 -5.108535,-0.783809 -8.28125,-0.9375 -0.130662,-3.556701 -0.470237,-6.762405 -0.96875,-9.25 C 75.761959,59.467174 75.626981,58.990925 75.5,58.5 z m -2.84375,12.09375 c 0.959338,0 1.895843,0.03282 2.8125,0.0625 C 75.48165,71.267751 75.5,71.871028 75.5,72.5 c 0,1.228616 -0.01449,2.438313 -0.0625,3.59375 -0.897358,0.0284 -1.811972,0.0625 -2.75,0.0625 -0.927373,0 -1.831062,-0.03473 -2.71875,-0.0625 -0.05109,-1.155437 -0.0625,-2.365134 -0.0625,-3.59375 0,-0.628972 0.01741,-1.232249 0.03125,-1.84375 0.895269,-0.02827 1.783025,-0.0625 2.71875,-0.0625 z M 68.5625,70.6875 c -0.01243,0.60601 -0.03125,1.189946 -0.03125,1.8125 0,1.22431 0.01541,2.407837 0.0625,3.5625 -3.125243,-0.150329 -5.92077,-0.471558 -8.09375,-0.90625 -0.784983,-0.157031 -1.511491,-0.316471 -2.125,-0.5 -0.107878,-0.704096 -0.1875,-1.422089 -0.1875,-2.15625 0,-0.115714 0.02849,-0.228688 0.03125,-0.34375 0.643106,-0.20284 1.389577,-0.390377 2.25,-0.5625 2.166953,-0.433487 4.97905,-0.75541 8.09375,-0.90625 z m 8.3125,0.03125 c 3.075121,0.15271 5.824455,0.446046 7.96875,0.875 0.857478,0.171534 1.630962,0.360416 2.28125,0.5625 0.0027,0.114659 0,0.228443 0,0.34375 0,0.735827 -0.07914,1.450633 -0.1875,2.15625 -0.598568,0.180148 -1.29077,0.34562 -2.0625,0.5 -2.158064,0.431708 -4.932088,0.754666 -8.03125,0.90625 0.04709,-1.154663 0.0625,-2.33819 0.0625,-3.5625 0,-0.611824 -0.01924,-1.185379 -0.03125,-1.78125 z M 57.15625,72.5625 c 0.0023,0.572772 0.06082,1.131112 0.125,1.6875 -0.125327,-0.05123 -0.266577,-0.10497 -0.375,-0.15625 -0.396499,-0.187528 -0.665288,-0.387337 -0.8125,-0.53125 -0.147212,-0.143913 -0.15625,-0.182756 -0.15625,-0.1875 0,-0.0047 -0.02221,-0.07484 0.125,-0.21875 0.147212,-0.143913 0.447251,-0.312472 0.84375,-0.5 0.07123,-0.03369 0.171867,-0.06006 0.25,-0.09375 z m 31.03125,0 c 0.08201,0.03503 0.175941,0.05872 0.25,0.09375 0.396499,0.187528 0.665288,0.356087 0.8125,0.5 0.14725,0.14391 0.15625,0.21405 0.15625,0.21875 0,0.0047 -0.009,0.04359 -0.15625,0.1875 -0.147212,0.143913 -0.416001,0.343722 -0.8125,0.53125 -0.09755,0.04613 -0.233314,0.07889 -0.34375,0.125 0.06214,-0.546289 0.09144,-1.094215 0.09375,-1.65625 z m -29.5,3.625 c 0.479308,0.123125 0.983064,0.234089 1.53125,0.34375 2.301781,0.460458 5.229421,0.787224 8.46875,0.9375 0.167006,2.84339 0.46081,5.433176 0.875,7.5 0.115218,0.574942 0.245268,1.063612 0.375,1.5625 -5.463677,-1.028179 -9.833074,-5.091831 -11.25,-10.34375 z m 27.96875,0 C 85.247546,81.408945 80.919274,85.442932 75.5,86.5 c 0.126981,-0.490925 0.261959,-0.967174 0.375,-1.53125 0.41419,-2.066824 0.707994,-4.65661 0.875,-7.5 3.204493,-0.15162 6.088346,-0.480068 8.375,-0.9375 0.548186,-0.109661 1.051942,-0.220625 1.53125,-0.34375 z M 70.0625,77.53125 c 0.865391,0.02589 1.723666,0.03125 2.625,0.03125 0.912062,0 1.782843,-0.0048 2.65625,-0.03125 -0.165173,2.736408 -0.453252,5.207651 -0.84375,7.15625 -0.152345,0.760206 -0.322989,1.438994 -0.5,2.03125 -0.437447,0.03919 -0.895856,0.0625 -1.34375,0.0625 -0.414943,0 -0.812719,-0.02881 -1.21875,-0.0625 -0.177011,-0.592256 -0.347655,-1.271044 -0.5,-2.03125 -0.390498,-1.948599 -0.700644,-4.419842 -0.875,-7.15625 z m 1.75,10.28125 c 0.284911,0.01545 0.554954,0.03125 0.84375,0.03125 0.325029,0 0.648588,-0.01171 0.96875,-0.03125 -0.05999,0.148763 -0.127309,0.31046 -0.1875,0.4375 -0.18789,0.396562 -0.386962,0.696416 -0.53125,0.84375 -0.144288,0.147334 -0.181857,0.125 -0.1875,0.125 -0.0056,0 -0.07446,0.02233 -0.21875,-0.125 C 72.355712,88.946416 72.18789,88.646562 72,88.25 71.939809,88.12296 71.872486,87.961263 71.8125,87.8125 z"></path></svg></div>\
	</div>';
		document.write(compassHTML);
		var looking = false; 
		var ring = false;
		var camera = this.viewer.camera;
		
		var cesiumwidth = document.getElementById("cesiumContainer").clientWidth;
		var cesiumheight = document.getElementById("cesiumContainer").clientHeight;
		var compass = document.getElementById("compass");
		var compassright = this.getNum(this.getStyle(compass,'right'));
		var compasswidth = this.getNum(this.getStyle(compass,'width'));
		var compasstop = this.getNum(this.getStyle(compass,'top'));
		var compassheight = this.getNum(this.getStyle(compass,'height'));
		var centerX = cesiumwidth-compassright-compasswidth/2;
		var centerY = (compasstop*1+compassheight/2*1)*1;
		//console.log(centerX);
		//console.log(centerY);
		var center={
			x:centerX,
			y:centerY
			};
		
		var handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);	

		var startMousePosition;
		var mousePosition;
		var curheading = camera.heading;
/* 		handler.setInputAction(function(movement) {
			//mousePosition = startMousePosition = movement.position;//movement.position是一个二维屏幕坐标
			curheading = camera.heading;	
		}, Cesium.ScreenSpaceEventType.LEFT_DOWN); */
		handler.setInputAction(function(movement) {
			mousePosition = movement.endPosition;
			if(ring)
			{
				var rad1 = this.toRingRad(startMousePosition.x,startMousePosition.y,centerX,centerY);//Math.atan((startMousePosition.x-centerX)/(-startMousePosition.y+centerY));
				var rad2 = this.toRingRad(mousePosition.x,mousePosition.y,centerX,centerY);//Math.atan((mousePosition.x-centerX)/(-mousePosition.y+centerY));
				//console.log(rad1*180/Math.PI);
				//console.log(rad2*180/Math.PI);
				viewer.camera.setView({
					heading : (curheading-(rad2-rad1))
				});
				//ring转动，heading变换
			} 
			$(".compass-outer-ring").css("transform","rotate("+Cesium.Math.toDegrees(Math.PI*2-this.viewer.camera.heading)+"deg)");
		}, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
		
		$(document).ready(function(){
			$(".compass-gyro-background").dblclick(function(){
				//无法实现flyto北方向的效果
				//var curOri = getcamera().orientation;
				//var currentView ={destination:getcamera().destination,
				//orientation:{heading:0.0,pitch:curOri.pitch,roll:curOri.roll}};
				//viewer.camera.flyTo(currentView);
				viewer.camera.setView({
					heading : 0.0
				});
			});
			$(".compass-gyro-background").mousedown(function(){
				$(".compass-gyro").addClass("compass-gyro-active");
				$(".compass-gyro").addClass("cursor-grab");
				$(".compass-rotation-marker").css("display","block");
				looking = true;
					$(document).mouseup(function(){
						$(".compass-gyro").removeClass("compass-gyro-active");
						$(".compass-rotation-marker").css("display","none");
						looking = false;
						});
				});
			$(".compass-outer-ring").mousedown(function(e){
				ring = true;
				mousePosition=startMousePosition={x:e.pageX,y:e.pageY};
				curheading = camera.heading;
				//console.log(startMousePosition);
					$(document).mouseup(function(){
						ring = false;
						curheading = camera.heading;
						});
				});
			});
		

		this.viewer.clock.onTick.addEventListener(function(clock) {
			var heading = camera.heading;
			if (looking) {
				var xvec = (mousePosition.x - centerX) / (compasswidth*1);
				var yvec = -(mousePosition.y - centerY) / (compassheight*1);
				var rad = Math.atan((mousePosition.x-centerX)/(-mousePosition.y+centerY));
				var factor = 0.1;
				if((-mousePosition.y+centerY)>0){
					//$(".compass-outer-ring").css("transform","rotate("+Cesium.Math.toDegrees(Math.PI*2-heading)+"deg)");
					$(".compass-rotation-marker").css("transform","rotate("+Cesium.Math.toDegrees(rad)+"deg)");
					//if(roll>=0)
					//viewer.camera.lookUp(yvec * factor);
					//viewer.camera.twistRight(xvec * factor);
				}
				else{
					//$(".compass-outer-ring").css("transform","rotate("+Cesium.Math.toDegrees(Math.PI*2-heading)+"deg)");
					$(".compass-rotation-marker").css("transform","rotate("+Cesium.Math.toDegrees(rad+Math.PI)+"deg)");
					//if(roll>=0)
					//viewer.camera.lookUp(yvec * factor);
					//viewer.camera.twistRight(xvec * factor);
				}

				this.viewer.camera.rotateUp(yvec * factor);
				this.viewer.camera.twistRight(xvec * factor);
				//console.log(pitch/Math.PI*180);

			}
			
			$(".compass-outer-ring").css("transform","rotate("+Cesium.Math.toDegrees(Math.PI*2-heading)+"deg)");
			//console.log(heading/Math.PI*180);
			//console.log(homeview.destination);
			//console.log(roll/Math.PI*180);
			
		});
	}
	
	function doNavi()
	{
		var homeView = {destination:new Cesium.Cartesian3(2659517.6470542485, -20201042.105477437, 14326778.724919258),
						orientation:{heading:0,pitch:-1.5688445983144326,roll:0}};
		var cameraHeight = this.getcamera().carto.height.toFixed(2);
		var zoomRate = cameraHeight/1000;
		//console.log(zoomRate);
		var naviHTML='    <div class="navigation-controls">\
			<div title="Zoom In" class="navigation-control" onclick="clickZoomIn()">\
				<div class="navigation-control-icon-zoom-in">+</div>\
			</div>\
			<div title="Reset View" class="navigation-control">\
				<div class="navigation-control-icon-reset" id="HomeView"><svg class="cesium-svgPath-svg" width="15" height="15" viewBox="0 0 15 15"><path d="M 7.5,0 C 3.375,0 0,3.375 0,7.5 0,11.625 3.375,15 7.5,15 c 3.46875,0 6.375,-2.4375 7.21875,-5.625 l -1.96875,0 C 12,11.53125 9.9375,13.125 7.5,13.125 4.40625,13.125 1.875,10.59375 1.875,7.5 1.875,4.40625 4.40625,1.875 7.5,1.875 c 1.59375,0 2.90625,0.65625 3.9375,1.6875 l -3,3 6.5625,0 L 15,0 12.75,2.25 C 11.4375,0.84375 9.5625,0 7.5,0 z"></path></svg></div>\
			</div>\
			<div title="Zoom Out" class="navigation-control-last" onclick="clickZoomOut()">\
				<div class="navigation-control-icon-zoom-out">–</div>\
			</div>\
			</div>';
		document.write(naviHTML);
		$("#HomeView").click(function(){
		  viewer.camera.flyTo(homeView);
		});
	}

	//辅助工具函数
	function getStyle(obj, attr)  
	{  
		if(obj.currentStyle)  
		{  
			return obj.currentStyle[attr];  
		}  
		else  
		{  
			return getComputedStyle(obj,null)[attr];  
		}  
	} 
	function getNum(text)
	{
		var value = text.replace(/[^0-9]/ig,""); 
		return value;
	}
	function toRingRad(x,y,centerX,centerY)
	{
		var rad;
		var test = Math.atan((x-centerX)/(-y+centerY));
		if((-y+centerY)>0)
		{
			rad=(test>=0)?test:(Math.PI*2+test);
		}
		else if((-y+centerY)==0) rad=(x>=0)?(Math.PI/2):(Math.PI/2*3);
		else
		{
			rad=(test<=0)?(Math.PI+test):(Math.PI+test);
		}
		return rad;
	}
	function showlonlat(num,lonlat)
	{
		var string ;
		if(lonlat=='lon')
		{
			if(num>0) string = Math.abs(num).toFixed(6)+'°E';
			else if(num==0) string = Math.abs(num).toFixed(6);
			else string = Math.abs(num).toFixed(6)+'°W';
		}
		else if(lonlat == 'lat')
		{
			if(num>0) string = Math.abs(num).toFixed(6)+'°N';
			else if(num==0) string = Math.abs(num).toFixed(6);
			else string = Math.abs(num).toFixed(6)+'°S';
		}
		else return false;
		return string;
		
		
	}	
	function clickZoomIn()
	{
		viewer.camera.zoomIn(this.zoomRate);
		var cameraheight0 = this.getcamera().carto.height;
		this.zoomRate = cameraheight0/100;
	}
	function clickZoomOut()
	{
		viewer.camera.zoomOut(this.zoomRate);
		var cameraheight0 = this.getcamera().carto.height;
		this.zoomRate = cameraheight0/100;
	}