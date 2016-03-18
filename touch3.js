/* touch v3.0 by-momo 2016-03-18 */
/* 
接口说明 
	全局暴露函数 touch，参数为被绑定的对象(原生)
	
	链式方法8个【参数是function】
		start()  move()  tap()  right()
		left()   up()  down()  revert()
		
	混合方法1个
		swipe(json)  【参数是json】
		
	解除滑动绑定及再次绑定
		bind()
		unbind()
		
	阻止冒泡
		noBubble()
		
	属性1个
		this.stop   【 true:停止，默认为false】
*/ 
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
		version :        '3.0',  //3.0改版
		constructor :  Touch,
		hasTouch :  'ontouchstart' in window,
		
		//全局冒泡开关
		cb : false,

		//初始化 [el：传入的待滑动元素]
		init : function(el){
			this.EVS = this.hasTouch ? 'touchstart' : 'mousedown';
			this.EVM = this.hasTouch ? 'touchmove' : 'mousemove';
			this.EVE = this.hasTouch ? 'touchend' : 'mouseup';
			this.el = el;
			this.XY = {};              //交互过程中的坐标集合
			this.type = {};           //传入的 滑动行为集合
			this.tapTimeOut = null; //tap延迟的定时器
			this.direction = '';         //最终移动的方向
			this.firstMove = false;  //是否是第一次滑动(便于做用户期望选择)
			this.stop = false;          //停止滑动
			this.estimate = '';         //用户预期滑动方向存储
			this.bind();                   //激活事件绑定
		},
		
		//事件绑定
		bind : function( callback,touchType ){
			var _this = this;
			_this.fn_ts = function(e){ _this.ts.call(_this,e) };
			_this.fn_tm = function(e){ _this.tm.call(_this,e) };
			_this.fn_te = function(e){ _this.te.call(_this,e) };
		
			_this.el.addEventListener( _this.EVS,_this.fn_ts,false );
			_this.el.addEventListener( _this.EVM,_this.fn_tm,false );
			_this.el.addEventListener( _this.EVE,_this.fn_te,false );
			_this.el.onselectstart = function(){return false;};
			return this;
		},
		
		//事件移除
		unbind : function(){
			this.el.removeEventListener( this.EVS,this.fn_ts );
			this.el.removeEventListener( this.EVM,this.fn_tm );
			this.el.removeEventListener( this.EVE,this.fn_te );
			return this;
		},
		
		//滑动回调队列
		swipe : function( json ){
			typeof(json)=='object' && (this.type = json);
			return this;
		},
		
		//禁止冒泡
		noBubble : function(){
			this.cb = true;
			return this;
		},
		
		//滑动开始
		ts : function(e){
			var _this = this, d = this.XY;
			
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
			_this.type['start'] && _this.type['start'].call(_this);
			
			//190毫秒后执行tap事件
			_this.tapTimeOut = setTimeout(function(){
				_this.type['tap'] && _this.type['tap'].call(_this);
				_this.stop = true;
			},190);
			
			e.cancelBubble = _this.cb;
			return false;
		},
		
		//滑动进行
		tm : function(e){
			if(this.stop){return;}
			var _this = this,
				 d = this.XY,
				 vv = {}; //返回的坐标差
				 
			//记录新坐标
			d.x2 = _this.hasTouch ? e.touches[0].pageX : e.clientX;
			d.y2 = _this.hasTouch ? e.touches[0].pageY : e.clientY;
			
			//坐标差(move函数的参数)
			vv.x = d.x2 - d.x1;
			vv.y = d.y2 - d.y1;
			
			//滑动判断
			if(Math.abs(vv.x)>3 || Math.abs(vv.y)>3){   //断定此次事件为move事件
			
				//已经滑动，清掉tap事件
				clearTimeout(_this.tapTimeOut);
				
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
							e.preventDefault();
						break;
						default:
						break;
					};
					
				}else{ //第二次开始运动	
					_this.type['move'] && _this.type['move'].call(_this,vv,e);
				}
				
			}else{  //断定此次事件为轻击事件
				e.preventDefault();
			}
			return false;
		},
		
		//滑动结束
		te : function(e){
			if(this.stop){return;}
			
			//当开始执行回调的时候，关闭start 和 move
			this.stop = true;
			
			//位置计算
			this.direction = Touch.swipeDirection(this.XY.x1, this.XY.x2, this.XY.y1, this.XY.y2);
			
			//开始运动
			if(this.direction && this.type[this.direction]){
				this.type[this.direction].call(this);
			}
			
			//清空坐标集
			this.XY = {};
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
	['start', 'move', 'tap', 'right', 'left', 'up', 'down', 'revert'].forEach(function(key){
		Touch.prototype[key] = function(callback){
			this.type[key] = callback;
			return this;
		}
	});
	
	//滑动方向识别函数
	Touch.swipeDirection=function(x1, x2, y1, y2){
		if(Math.abs(x2 - x1) > 30 || Math.abs(y1 - y2) > 30){
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