/* touch v3.3 by-momo 2016-11-17 */
/* 
接口说明 
	全局暴露函数 touch，参数为被绑定的对象(原生)
	
	链式方法10个【参数是function】
		start()  move()  tap()  right()
		left()   up()  down()  revert()
		longtap()  end()
	混合方法1个
		swipe(json)  【参数是json】
		
	解除滑动绑定及再次绑定
		bind()
		unbind()
		
	保留浏览器默认行为 (不设置为阻止)
	dP()
	
	阻止/恢复冒泡
		noBubble()
		reBubble()
		
	属性2个
		this.stop   【 true:停止，默认为false】
		this.cb   【 true:不冒泡，默认为false】
		
	其他说明，为防止ios的tap事件点穿（非冒泡）
	请在tap事件里，手工添加
	e.preventDefault();

 	回调函数的参数说明：
 	start和tap方法，可接收到事件对象 e
 	move方法，参数有 移动的坐标{x,y}和时间对象 e
 	move方法新增rate参数（移动值倍率输出），包括x，y两个属性

*/

/* 3.3版更新文档 */
//修复了单击触发revert事件，增加保留浏览器默认行为

"use strict";
;(function(global,doc,factoryFn){
	var factory = factoryFn(global,doc);
	//window接口
	window.touch = window.touch || factory;
	//CommonJS规范的接口
	window.define && define(function(require,exports,module){
		return factory;
	});
})(this,document,function(window,document){
	//class-touch
	var Touch = new Function();

	Touch.prototype = {
		version :        '3.3',
		constructor :  Touch,
		hasTouch :  'ontouchstart' in window,

		//全局冒泡开关
		cb : false,

		//初始化 [el：传入的待滑动元素]
		init : function(el){
			if(!el){return;}
			this.EVS = this.hasTouch ? 'touchstart' : 'mousedown';
			this.EVM = this.hasTouch ? 'touchmove' : 'mousemove';
			this.EVE = this.hasTouch ? 'touchend' : 'mouseup';
			this.el = el;
			this.XY = {};              //交互过程中的坐标集合
			this.type = {};           //传入的 滑动行为集合
			this.tapTimeOut = null; //tap延迟的定时器
			this.longtapTimeOut = null; //long延迟的定时器
			this.direction = '';         //最终移动的方向
			this.firstMove = false;  //是否是第一次滑动(便于做用户期望选择)
			this.stop = false;          //停止滑动
			this.estimate = '';         //用户预期滑动方向存储
			this.preventD = true;   //move时是否阻止默认行为
			this.el._evs = this.el._evs || null;   //事件队列
			this.bind();                   //激活事件绑定
		},

		//事件绑定
		bind : function( callback,touchType ){
			var _this = this;
			//事件队列填充(待完善)
			if(!_this.el._evs){
				_this.el._evs = {
					fn_ts : function(e){ _this.ts.call(_this,e) },
					fn_tm : function(e){ _this.tm.call(_this,e) },
					fn_te :  function(e){ _this.te.call(_this,e) }
				};
			}
			_this.el.addEventListener( _this.EVS,_this.el._evs.fn_ts,false );
			_this.el.addEventListener( _this.EVM,_this.el._evs.fn_tm,false );
			_this.el.addEventListener( _this.EVE,_this.el._evs.fn_te,false );
			_this.el.onselectstart = function(){return false;};
			return this;
		},

		//事件移除
		unbind : function(){
			var _this = this;
			_this.el.removeEventListener( _this.EVS,_this.el._evs.fn_ts );
			_this.el.removeEventListener( _this.EVM,_this.el._evs.fn_tm );
			_this.el.removeEventListener( _this.EVE,_this.el._evs.fn_te );
			return this;
		},

		//滑动回调队列
		swipe : function( json ){
			typeof(json)=='object' && (this.type = json);
			return this;
		},
		
		//允许默认行为
		dP: function(){
			this.preventD = false;
			 return this;
		 },

		//禁止冒泡
		noBubble : function(){
			this.cb = true;
			return this;
		},

		//恢复冒泡
		reBubble : function(){
			this.cb = false;
			return this;
		},
		//滑动开始
		ts : function(e){
			var _this = this, d = this.XY;
			clearTimeout(_this.longtapTimeOut);

			//根据传入的行为绑定，预估出用户期望
			if(!this.estimate){
				if( this.type.left || this.type.right ){
					this.estimate = 'x';
				}
				if( this.type.up || this.type.down ){
					this.estimate = 'y';
				}
				if(this.type.move && !this.type.left && !this.type.right &&  !this.type.down  && !this.type.up){
					this.estimate = 'm';
				}
			}

			//重置滑动开关
			_this.stop = false;

			//记录坐标
			d.x1 = _this.hasTouch ? e.touches[0].pageX : e.clientX;
			d.y1 = _this.hasTouch ? e.touches[0].pageY : e.clientY;

			//执行touchstart事件
			_this.type['start'] && _this.type['start'].call(_this,e);

			//190毫秒后执行tap事件
			_this.tapTimeOut = setTimeout(function(){
				_this.type['tap'] && _this.type['tap'].call(_this,e);
				//_this.stop = true;
			},190);

			//900毫秒后执行longtap事件
			if(_this.type['longtap']){
				e.preventDefault();
				_this.longtapTimeOut = setTimeout(function(){
					_this.type['longtap'].call(_this,e);
					//_this.stop = true;
				},900);
			}

			e.cancelBubble = _this.cb;
			return false;
		},

		//滑动进行
		tm : function(e){
			if(this.stop){return;}
			var _this = this,
			d = this.XY,
			vv = {}, //返回的坐标差
			rate = {}; //返回的倍率基准
			
			//记录新坐标
			d.x2 = _this.hasTouch ? e.touches[0].pageX : e.clientX;
			d.y2 = _this.hasTouch ? e.touches[0].pageY : e.clientY;

			//坐标差(move函数的参数)
			vv.x = d.x2 - d.x1;
			vv.y = d.y2 - d.y1;

			//倍率计算
			rate.y = Number((vv.y * 0.005).toFixed(3));
			rate.y>1 && (rate.y=1);
			rate.y<-1 && (rate.y=-1);

			rate.x = Number((vv.x * 0.005).toFixed(3));
			rate.x>1 && (rate.x=1);
			rate.x<-1 && (rate.x=-1);

			//滑动判断
			if(Math.abs(vv.x)>3 || Math.abs(vv.y)>3){   //断定此次事件为move事件

				//已经滑动，清掉tap事件
				clearTimeout(_this.tapTimeOut);
				clearTimeout(_this.longtapTimeOut);

				e.cancelBubble=_this.cb;

				//先判断用户行为，不move
				if( !_this.firstMove ){
					//匹配用户意图
					switch(_this.estimate){
						case 'x':
							if(Math.abs(vv.x)>Math.abs(vv.y)){
								_this.firstMove = true;
								e.preventDefault();
							}else{
								_this.stop = true;
								return;
							}
							break;
						case 'y':
							if(Math.abs(vv.y)>Math.abs(vv.x)){
								_this.firstMove = true;
								e.preventDefault();
							}else{
								_this.stop = true;
								return;
							}
							break;
						case 'm':
							_this.firstMove = true;
							if(_this.preventD){e.preventDefault();}
							break;
						default:
							break;
					};

				}else{ //第二次开始运动
					if(_this.preventD){e.preventDefault();}
					_this.type['move'] && _this.type['move'].call(_this,vv,e,rate);
				}

			}else{  //断定此次事件为轻击事件
				e.preventDefault();
			}
			return false;
		},

		//滑动结束
		te : function(e){
			if(this.stop){return;}

			this.type['end'] && this.type['end'].call(this,e);

			clearTimeout(this.longtapTimeOut);

			//当开始执行回调的时候，关闭start 和 move
			this.stop = true;

			//位置计算
			this.direction = Touch.swipeDirection(this.XY.x1, this.XY.x2, this.XY.y1, this.XY.y2);

			//开始运动
			if(this.direction != 'none'){
				if(this.type[this.direction]){
					this.type[this.direction].call(this);
				}else if(this.type['revert']){
					this.type['revert'].call(this);
				}
			}

			//清空坐标集
			this.XY = {};

			//恢复move的方向识别
			this.firstMove = false;
		},

		//简易transForm
		transForm : function(obj,speed,iTarget,type){
			var ele=obj.style;
			type = type || 'linear';
			speed = speed || 0;
			ele.webkitTransition = ele.transition ='all '+ speed + 'ms '+type;

			iTarget[0]=iTarget[0]+'';
			iTarget[1]=iTarget[1]+'';
			if(iTarget[0].indexOf('px')==-1){iTarget[0]+='px';}
			if(iTarget[1].indexOf('px')==-1){iTarget[1]+='px';}

			ele.webkitTransform =ele.transform ='translateX('+iTarget[0]+') translateY('+ iTarget[1] +') translateZ(0)';
		}
	};

	//扩展方法
	['start','end', 'move', 'tap', 'right', 'left', 'up', 'down', 'revert','longtap'].forEach(function(key){
		Touch.prototype[key] = function(callback){
			this.type[key] = callback;
			return this;
		}
	});

	//滑动方向识别函数
	Touch.swipeDirection=function(x1, x2, y1, y2){
		if(!x2 && !y2){
			return 'none';
		}
		if(Math.abs(x2 - x1) > 50 || Math.abs(y1 - y2) > 50){
			return Math.abs(x1 - x2) >=	Math.abs(y1 - y2) ? (x1 - x2 > 0 ? 'left' : 'right') : (y1 - y2 > 0 ? 'up' : 'down');
		}else{
			return 'revert';
		}
	};

	//init构造器原型指向touch的原型
	Touch.prototype.init.prototype = Touch.prototype;

	//输出工厂函数
	return function( el ){
		return new Touch.prototype.init( el );
	};
});